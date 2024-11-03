import time
import asyncio
import traceback
import logging
import math

from channels.layers import get_channel_layer
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from django.db import transaction
from asgiref.sync import async_to_sync

from profiles.models import Profile
from game.models import GameHistory

# SERVER
TICK_RATE = 1.0 / 128

# GAME RULES
BOUNCE_SPEED_BOOST = 1.01
MAX_BOUNCE_ANGLE = math.pi / 4
BALL_SPEED = 3

# MAP
MAP_LENGTH = 10
MAP_HEIGHT = 0.15
MAP_WIDTH = 2.5

# BALL
BALL_RADIUS = 0.1
DEFAULT_BALL_X = 0
DEFAULT_BALL_Y = MAP_HEIGHT
DEFAULT_BALL_Z = 0

# PAD
PAD_LENGTH = 0.1
PAD_WIDTH = 0.4
PAD_MOVE_DISTANCE = 0.12
PAD_MAX_MOVE = MAP_WIDTH / 2 - PAD_WIDTH / 2
DEFAULT_PAD_0_X = MAP_LENGTH / 2
DEFAULT_PAD_0_Y = MAP_HEIGHT
DEFAULT_PAD_0_Z = 0
DEFAULT_PAD_1_X = -MAP_LENGTH / 2
DEFAULT_PAD_1_Y = MAP_HEIGHT
DEFAULT_PAD_1_Z = 0

# CAMERA
CAMERA_DISTANCE_X = 4
CAMERA_DISTANCE_Y = 2.5
CAMERA_DISTANCE_Z = 0
DEFAULT_CAMERA_0_X = DEFAULT_PAD_0_X + CAMERA_DISTANCE_X
DEFAULT_CAMERA_0_Y = DEFAULT_PAD_0_Y + CAMERA_DISTANCE_Y
DEFAULT_CAMERA_0_Z = DEFAULT_PAD_0_Z + CAMERA_DISTANCE_Z
DEFAULT_CAMERA_1_X = DEFAULT_PAD_1_X - CAMERA_DISTANCE_X
DEFAULT_CAMERA_1_Y = DEFAULT_PAD_1_Y + CAMERA_DISTANCE_Y
DEFAULT_CAMERA_1_Z = DEFAULT_PAD_1_Z - CAMERA_DISTANCE_Z

# GAME TIMER
DEFAULT_GAME_TIMER_MINUTES = 1
DEFAULT_GAME_TIMER_SECONDS = 0

channel_layer = get_channel_layer()

class PongEngine:
    def __init__(self, game_id, player_ids, is_tournament):
        self.game_id = game_id
        self.player_ids = player_ids
        self.game_channel = 'game_' + str(game_id)
        self.is_tournament = is_tournament

    async def game_loop(self):
        self.game_continue = True
        for player_id in self.player_ids:
            await player_is_in_game(player_id)

        await channel_layer.group_send(
            'general_chat',
            {
                'type': 'send.chat.message',
                'name': 'engine',
                'message': f'game id: {self.game_id}'
            }
        )
        await channel_layer.group_send(
            'general_chat',
            {
                'type': 'send.chat.message',
                'name': 'engine-game',
                'message': '_'.join([str(player_id) for player_id in self.player_ids])
            }
        )
        # Send game start (before, wait for everyone to add the game channel)
        await asyncio.sleep(1)
        await channel_layer.group_send(
            self.game_channel,
            {'type': 'send.game.start'}
        )

        # Initialize game timer and score
        self.game_time_left = DEFAULT_GAME_TIMER_MINUTES * 60 + DEFAULT_GAME_TIMER_SECONDS
        self.game_timer = {'minutes': DEFAULT_GAME_TIMER_MINUTES, 'seconds': DEFAULT_GAME_TIMER_SECONDS}
        self.game_state = {'PLAYER_SCORE': {'0': 0, '1': 0}}
        self.ball_speed = {'x': 5, 'z': 1}

        # Set game state
        await self.reset_physic()

        # Wait for players
        timeout_count = 0
        players_ready = False
        while (not players_ready):
            if timeout_count > 50:
                break
            players_ready = True
            for player_id in self.player_ids:
                player = await database_sync_to_async(Profile.objects.get)(pk=player_id)
                if not player.is_game_ready:
                    players_ready = False

            await asyncio.sleep(0.1)
            timeout_count += 1

        # Subscribe players to periodic game updates
        await channel_layer.send(
            'update-server',
            {
                'type': 'game.update',
                'game_id': self.game_id,
                'game_channel': self.game_channel,
            }
        )

        while (self.game_continue):
            # Initialize game objects
            await self.reset_physic()

            # Tick rate setup
            tick_rate = TICK_RATE
            tick_count = 0
            start_time = time.time()

            lap_start_time = time.time()
            self.round_continue = True
            while (self.round_continue):
                lap_duration = time.time() - lap_start_time

                # Retrieve game state and players movement requests
                self.game_state = await cache.aget(self.game_channel)
                self.game_movement = await cache.aget(self.game_channel + '_movement')

                # Apply physic (update objects and apply game rules)
                await self.apply_physic(lap_duration)

                # Update game timer
                await self.update_game_timer(lap_duration)

                lap_start_time = time.time()

                # Ensure tick rate
                tick_count += 1
                targeted_time = start_time + tick_rate * tick_count
                time_to_wait = targeted_time - time.time()
                if time_to_wait > 0:
                    await asyncio.sleep(time_to_wait)

                # Update game state in cache
                await cache.aset(self.game_channel, self.game_state)

        # Send game results (as frame message ?)
        # Update profiles status and player things
        # if not self.is_tournament:
        await update_players_exit_game(self.player_ids)

        # Send game end
        await channel_layer.group_send(
            self.game_channel,
            {'type': 'send.game.end'}
        )

        # Save game history
        await self.save_game_history()

        # Send result
        winner_id, loser_id = await self.get_history_winner_loser_id()
        await channel_layer.group_send(
            'notifications_' + str(winner_id),
            {
                'type': 'send.game.frame.message',
                'message': 'You Win !',
            }
        )
        await channel_layer.group_send(
            'notifications_' + str(loser_id),
            {
                'type': 'send.game.frame.message',
                'message': 'You Lose...',
            }
        )
        await asyncio.sleep(4)
        await channel_layer.group_send(
            'notifications_' + str(winner_id),
            {'type': 'send.frame.remove'}
        )
        await channel_layer.group_send(
            'notifications_' + str(loser_id),
            {'type': 'send.frame.remove'}
        )

        winner_id = await self.get_winner_id()
        return winner_id

    async def reset_physic(self):
        self.direction = 1
        self.ball_speed = {'x': -self.ball_speed['x'] / abs(self.ball_speed['x']) * BALL_SPEED, 'z': -self.ball_speed['z'] / abs(self.ball_speed['z'])}
        self.game_state = {
            'type': 'send.game.state',
            'PLAYER_0': self.player_ids[0],
            'PLAYER_1': self.player_ids[1],
            'BALL': {'x': DEFAULT_BALL_X, 'y': DEFAULT_BALL_Y, 'z': DEFAULT_BALL_Z},
            'CAMERA_0': {'x': DEFAULT_CAMERA_0_X, 'y': DEFAULT_CAMERA_0_Y, 'z': DEFAULT_CAMERA_0_Z},
            'CAMERA_1': {'x': DEFAULT_CAMERA_1_X, 'y': DEFAULT_CAMERA_1_Y, 'z': DEFAULT_CAMERA_1_Z},
            'PAD_0': {'x': DEFAULT_PAD_0_X, 'y': DEFAULT_PAD_0_Y, 'z': DEFAULT_PAD_0_Z, },
            'PAD_1': {'x': DEFAULT_PAD_1_X, 'y': DEFAULT_PAD_1_Y, 'z': DEFAULT_PAD_1_Z, },
            'TIMER': self.game_timer,
            'PLAYER_SCORE': self.game_state['PLAYER_SCORE'],
            'ENDED': not self.game_continue,
        }
        self.game_movement = {
            'PAD_0': '',
            'PAD_1': '',
        }
        await cache.aset(self.game_channel, self.game_state)
        await cache.aset(self.game_channel + '_movement', self.game_movement)
    
    async def apply_physic(self, lap_duration):
        # PAD MOVEMENTS
        if self.game_movement['PAD_0'] in ['left', 'right']:
            await self.move_pad('PAD_0', -1)
        if self.game_movement['PAD_1'] in ['left', 'right']:
            await self.move_pad('PAD_1', 1)

        # BALL MOVEMENT
        await self.move_ball(lap_duration)
            
        # BALL WALL BOUNCE
        await self.wall_bounce()

        # BALL PAD BOUNCE
        await self.pad_bounce()

        # BALL SCORED
        await self.ball_scored()

    async def update_game_timer(self, lap_duration):
        self.game_time_left -= lap_duration
        if self.game_time_left < 0:
            self.game_time_left = 0
        minutes = int(self.game_time_left // 60)
        seconds = int(self.game_time_left % 60)
        self.game_timer = {'minutes': max(minutes, 0), 'seconds': max(seconds, 0)}
        self.game_state['TIMER'] = self.game_timer

        # Stop the game when timer reach 0
        if self.game_time_left <= 0:
            if self.game_state['PLAYER_SCORE']['0'] != self.game_state['PLAYER_SCORE']['1']:
                self.round_continue = False
                self.game_continue = False
                self.game_state['ENDED'] = True
            # return

    async def move_pad(self, pad, direction):
        if self.game_movement[pad] == 'left':
            move_distance = abs(self.game_state[pad]['z'] - direction * PAD_MOVE_DISTANCE)
            if move_distance >= PAD_MAX_MOVE:
                self.game_state[pad]['z'] = -direction * PAD_MAX_MOVE
            else:
                self.game_state[pad]['z'] -= direction * PAD_MOVE_DISTANCE

            self.game_movement[pad] = ''
            await cache.aset(self.game_channel + '_movement', self.game_movement)
        elif self.game_movement[pad] == 'right':
            move_distance = abs(self.game_state[pad]['z'] + direction * PAD_MOVE_DISTANCE)
            if move_distance >= PAD_MAX_MOVE:
                self.game_state[pad]['z'] = direction * PAD_MAX_MOVE
            else:
                self.game_state[pad]['z'] += direction * PAD_MOVE_DISTANCE

            self.game_movement[pad] = ''
            await cache.aset(self.game_channel + '_movement', self.game_movement)

    async def move_ball(self, lap_duration):
        self.game_state['BALL']['x'] += self.ball_speed['x'] * lap_duration
        self.game_state['BALL']['z'] += self.ball_speed['z'] * lap_duration

    async def wall_bounce(self):
        if self.game_state['BALL']['z'] + BALL_RADIUS >= MAP_WIDTH / 2:
            self.game_state['BALL']['z'] = MAP_WIDTH / 2 - BALL_RADIUS
            self.ball_speed['z'] *= -1
            self.ball_speed['x'] *= BOUNCE_SPEED_BOOST
            self.ball_speed['z'] *= BOUNCE_SPEED_BOOST
        if self.game_state['BALL']['z'] - BALL_RADIUS <= -MAP_WIDTH / 2:
            self.game_state['BALL']['z'] = -MAP_WIDTH / 2 + BALL_RADIUS
            self.ball_speed['z'] *= -1
            self.ball_speed['x'] *= BOUNCE_SPEED_BOOST
            self.ball_speed['z'] *= BOUNCE_SPEED_BOOST

    async def pad_bounce(self):
        # PAD 0 intersection
        if (self.game_state['BALL']['x'] + BALL_RADIUS + PAD_LENGTH / 2 >= self.game_state['PAD_0']['x'] and 
            self.game_state['BALL']['z'] <= self.game_state['PAD_0']['z'] + PAD_WIDTH / 2 and
            self.game_state['BALL']['z'] >= self.game_state['PAD_0']['z'] - PAD_WIDTH / 2):
            # Take care of limits
            self.game_state['BALL']['x'] = self.game_state['PAD_0']['x'] - BALL_RADIUS - PAD_LENGTH
            # Change velocity direction accordingly to relative intersection norm
            relative_intersection = self.game_state['PAD_0']['z'] - self.game_state['BALL']['z']
            normalized = relative_intersection / (PAD_WIDTH / 2)
            bounce_angle = normalized * MAX_BOUNCE_ANGLE
            self.ball_speed['x'] = BALL_SPEED * -math.cos(bounce_angle)
            self.ball_speed['z'] = BALL_SPEED * -math.sin(bounce_angle)
            self.ball_speed['x'] *= BOUNCE_SPEED_BOOST
            self.ball_speed['z'] *= BOUNCE_SPEED_BOOST
        # PAD 1 intersection
        if (self.game_state['BALL']['x'] - BALL_RADIUS - PAD_LENGTH / 2 <= self.game_state['PAD_1']['x'] and 
            self.game_state['BALL']['z'] <= self.game_state['PAD_1']['z'] + PAD_WIDTH / 2 and
            self.game_state['BALL']['z'] >= self.game_state['PAD_1']['z'] - PAD_WIDTH / 2):
            # Take care of limits
            self.game_state['BALL']['x'] = self.game_state['PAD_1']['x'] + BALL_RADIUS + PAD_LENGTH
            # Change velocity direction accordingly to relative intersection norm
            relative_intersection = self.game_state['PAD_0']['z'] - self.game_state['BALL']['z']
            normalized = relative_intersection / (PAD_WIDTH / 2)
            bounce_angle = -normalized * MAX_BOUNCE_ANGLE
            self.ball_speed['x'] = BALL_SPEED * -math.cos(bounce_angle)
            self.ball_speed['z'] = BALL_SPEED * -math.sin(bounce_angle)
            self.ball_speed['x'] *= BOUNCE_SPEED_BOOST
            self.ball_speed['z'] *= BOUNCE_SPEED_BOOST

    async def ball_scored(self):
        if self.game_state['BALL']['x'] > MAP_LENGTH / 2:
            self.game_state['PLAYER_SCORE']['1'] += 1
            self.round_continue = False
        elif self.game_state['BALL']['x'] < -MAP_LENGTH / 2:
            self.game_state['PLAYER_SCORE']['0'] += 1
            self.round_continue = False

    @database_sync_to_async
    @transaction.atomic
    def save_game_history(self):
        history = GameHistory.objects.get(pk=self.game_id)
        history.score_0 = self.game_state['PLAYER_SCORE']['0']
        history.score_1 = self.game_state['PLAYER_SCORE']['1']
        player_0 = Profile.objects.get(pk=self.game_state['PLAYER_0'])
        player_1 = Profile.objects.get(pk=self.game_state['PLAYER_1'])

        if self.game_state['PLAYER_SCORE']['0'] > self.game_state['PLAYER_SCORE']['1']:
            history.winner_id = self.game_state['PLAYER_0']
            player_0.actual_streak += 1
            player_1.actual_streak = 0
            if player_0.actual_streak > player_0.best_streak:
                player_0.best_streak = player_0.actual_streak
        elif self.game_state['PLAYER_SCORE']['1'] > self.game_state['PLAYER_SCORE']['0']:
            history.winner_id = self.game_state['PLAYER_1']
            player_1.actual_streak += 1
            player_0.actual_streak = 0
            if player_1.actual_streak > player_1.best_streak:
                player_1.best_streak = player_1.actual_streak
        else:
            history.winner_id = None

        history.is_in_progress = False

        history.save(update_fields=['score_0', 'score_1', 'winner_id', 'is_in_progress'])
        player_0.save(update_fields=['actual_streak', 'best_streak'])
        player_1.save(update_fields=['actual_streak', 'best_streak'])

    @database_sync_to_async
    @transaction.atomic
    def get_history_winner_loser_id(self):
        history = GameHistory.objects.get(pk=self.game_id)
        if history.player_0_id == history.winner_id:
            return history.winner_id, history.player_1_id
        else:
            return history.winner_id, history.player_0_id

    @database_sync_to_async
    @transaction.atomic
    def get_winner_id(self):
        history = GameHistory.objects.get(pk=self.game_id)
        if history.winner_id != None:
            return history.winner_id
        return history.player_0_id

async def send_tournament_state(player_ids, game_ids):
    event = {'type': 'send.game.tournament'}
    for i in range(0, 7):
        event['game_' + str(i)] = {'player_0': {'name': 'Unknown', 'avatar': None, 'score': 0},
                                   'player_1': {'name': 'Unknown', 'avatar': None, 'score': 0},
                                   'winner': 'unknown'}
    for i in range(0, len(game_ids)):
        event['game_' + str(i)] = await get_history_infos(game_ids[i])
    for player_id in player_ids:
        await channel_layer.group_send(
            'notifications_' + str(player_id),
            event
        )

async def send_tournament_end(player_ids):
    for player_id in player_ids:
        await update_player_is_in_tournament(player_id)
        await channel_layer.group_send(
            'notifications_' + str(player_id),
            {'type': 'send.tournament.end'}
        )

async def pong_tournament(player_ids):
    await channel_layer.group_send(
        'general_chat',
        {
            'type': 'send.chat.message',
            'name': 'engine-tournament',
            'message': '_'.join([str(player_id) for player_id in player_ids])
        }
    )
    all_game_ids = []
    winner_ids = player_ids
    while len(winner_ids) > 1:
        # Make groups
        groups = [winner_ids[i:i+2] for i in range(0, len(winner_ids), 2)]

        # Create games and make players join games channel
        game_ids = [await create_game(group) for group in groups]
        all_game_ids += game_ids

        # Inform about games
        await send_tournament_state(player_ids, all_game_ids)

        # Run games and get winners
        engines = [PongEngine(game_id, group, True) for game_id, group in zip(game_ids, groups)]
        tasks = [engine.game_loop() for engine in engines]
        winner_ids = await asyncio.gather(*tasks)

        # Inform results
        await send_tournament_state(player_ids, all_game_ids)

    # Inform results
    await send_tournament_state(player_ids, all_game_ids)
    await send_tournament_end(player_ids)

class EngineConsumer(AsyncConsumer):
    async def classic_game(self, event):
        await channel_layer.group_send(
            'general_chat',
            {
                'type': 'send.chat.message',
                'name': 'engine',
                'message': 'classic_game'
            }
        )
        if 'player_ids' in event and 'game_id' in event:
            game_id = event['game_id']
            player_ids = event['player_ids']
        else:
            return

        # Create game instance
        try:
            engine = PongEngine(game_id, player_ids, False)
            asyncio.create_task(engine.game_loop())
        except Exception:
            logging.error(traceback.format_exc())

    async def tournament(self, event):
        await channel_layer.group_send(
            'general_chat',
            {
                'type': 'send.chat.message',
                'name': 'engine',
                'message': 'tournament'
            }
        )
        if 'player_ids' in event:
            player_ids = event['player_ids']
        else:
            return
        try:
            asyncio.create_task(pong_tournament(player_ids))
        except Exception:
            logging.error(traceback.format_exc())

@database_sync_to_async
@transaction.atomic
def update_players_exit_game(profile_ids):
    for profile_id in profile_ids:
        profile = Profile.objects.get(pk=profile_id)
        profile.is_in_game = False
        profile.is_game_ready = False
        profile.actual_game_id = None
        profile.save(update_fields=['is_in_game', 'is_game_ready', 'actual_game_id'])

@database_sync_to_async
@transaction.atomic
def create_game(player_ids):
    game_history = GameHistory.objects.create(player_0_id=player_ids[0], player_1_id=player_ids[1])

    for player_id in player_ids:
        player = Profile.objects.get(pk=player_id)
        game_history.players.add(player)
        player.actual_game_id = game_history.pk
        player.save(update_fields=['actual_game_id'])
        async_to_sync(channel_layer.group_send)(
            'notifications_' + str(player.pk),
            {'type': 'join.game.channel'}
        )

    return game_history.pk

@database_sync_to_async
@transaction.atomic
def get_history_infos(game_id):
    history = GameHistory.objects.get(pk=game_id)
    player_0 = Profile.objects.get(pk=history.player_0_id)
    player_1 = Profile.objects.get(pk=history.player_1_id)
    if history.winner_id == None:
        winner = 'unknown'
    elif history.winner_id == history.player_0_id:
        winner = 'player_0'
    else:
        winner = 'player_1'
    return {'player_0': {'name': player_0.name, 'avatar': player_0.avatar.url, 'score': history.score_0},
            'player_1': {'name': player_1.name, 'avatar': player_1.avatar.url, 'score': history.score_1},
            'winner': winner}

@database_sync_to_async
@transaction.atomic
def update_player_is_in_tournament(player_id):
    player = Profile.objects.get(pk=player_id)
    player.is_in_tournament = False
    player.save(update_fields=['is_in_tournament'])

@database_sync_to_async
@transaction.atomic
def player_is_in_game(profile_id):
    profile = Profile.objects.get(pk=profile_id)
    profile.is_in_game = True
    profile.save(update_fields=['is_in_game'])
