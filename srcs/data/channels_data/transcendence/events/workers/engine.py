import time
import asyncio
import traceback
import logging

from channels.layers import get_channel_layer
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache

from profiles.models import Profile

# SERVER
TICK_RATE = 1.0 / 128

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
PAD_WIDTH = 0.3
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
DEFAULT_GAME_TIMER_MINUTES = 3
DEFAULT_GAME_TIMER_SECONDS = 0

channel_layer = get_channel_layer()

class PongEngine:
    def __init__(self, game_id, player_ids):
        self.game_id = game_id
        self.player_ids = player_ids
        self.game_channel = 'game_' + str(game_id)

    async def game_loop(self):
        self.game_continue = True

        await channel_layer.group_send(
            'general_chat',
            {
                'type': 'send.chat.message',
                'name': 'engine',
                'message': f'game id: {self.game_id}'
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
        self.score = {'0': 0, '1': 0}
        self.ball_speed = {'x': 5, 'z': 1}

        # Set game state
        await self.reset_physic()

        # Wait for players
        players_ready = False
        while (not players_ready):
            players_ready = True
            for player_id in self.player_ids:
                player = await database_sync_to_async(Profile.objects.get)(pk=player_id)
                if not player.is_game_ready:
                    players_ready = False

            await asyncio.sleep(0.1)

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

            # Send round start
            # for i in range(3, 0, -1):
            #     players_broadcast(player_ids, {'type': 'send.frame.message', 'message': str(i)})
            #     time.sleep(1)
            # players_broadcast(player_ids, {'type': 'send.frame.message', 'message': 'Fight !'})

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
        await update_players_exit_game(self.player_ids)

        # Send game end
        await channel_layer.group_send(
            self.game_channel,
            {'type': 'send.game.end'}
        )

        # Save game history

    async def reset_physic(self):
        self.direction = 1
        self.ball_speed = {'x': -self.ball_speed['x'], 'z': self.ball_speed['z']}
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
            'PLAYER_SCORE': self.score,
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
        minutes = int(self.game_time_left // 60)
        seconds = int(self.game_time_left % 60)
        self.game_timer = {'minutes': max(minutes, 0), 'seconds': max(seconds, 0)}
        self.game_state['TIMER'] = self.game_timer

        # Stop the game when timer reach 0
        if self.game_time_left < 0:
            self.round_continue = False
            self.game_continue = False
            self.game_state['ENDED'] = True
            return

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
        if abs(self.game_state['BALL']['z']) >= MAP_WIDTH / 2:
            self.ball_speed['z'] *= -1

    async def pad_bounce(self):
        for pad in ['PAD_0', 'PAD_1']:
            if (abs(self.game_state['BALL']['x']) >= abs(self.game_state[pad]['x']) and 
                self.game_state['BALL']['z'] <= self.game_state[pad]['z'] + PAD_LENGTH / 2 and
                self.game_state['BALL']['z'] >= self.game_state[pad]['z'] - PAD_LENGTH / 2):
                self.ball_speed['x'] *= -1
                return

    async def ball_scored(self):
        # if self.game_state['BALL']['x'] > MAP_LENGTH / 2:
        pass

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
            engine = PongEngine(game_id, player_ids)
            asyncio.create_task(engine.game_loop())
        except Exception:
            logging.error(traceback.format_exc())

@database_sync_to_async
def update_players_exit_game(profile_ids):
    for profile_id in profile_ids:
        profile = Profile.objects.get(pk=profile_id)
        profile.is_in_game = False
        profile.is_game_ready = False
        profile.actual_game_id = None
        profile.save(update_fields=['is_in_game', 'is_game_ready', 'actual_game_id'])