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
PAD_LENGTH = 0.3
DEFAULT_PAD_0_X = MAP_LENGTH / 2
DEFAULT_PAD_0_Y = MAP_HEIGHT
DEFAULT_PAD_0_Z = 0
DEFAULT_PAD_1_X = -MAP_LENGTH / 2
DEFAULT_PAD_1_Y = MAP_HEIGHT
DEFAULT_PAD_1_Z = 0

# CAMERA
CAMERA_DISTANCE_X = 4
CAMERA_DISTANCE_Y = 4
CAMERA_DISTANCE_Z = 0
DEFAULT_CAMERA_0_X = DEFAULT_PAD_0_X + CAMERA_DISTANCE_X
DEFAULT_CAMERA_0_Y = DEFAULT_PAD_0_Y + CAMERA_DISTANCE_Y
DEFAULT_CAMERA_0_Z = DEFAULT_PAD_0_Z + CAMERA_DISTANCE_Z
DEFAULT_CAMERA_1_X = DEFAULT_PAD_1_X + CAMERA_DISTANCE_X
DEFAULT_CAMERA_1_Y = DEFAULT_PAD_1_Y + CAMERA_DISTANCE_Y
DEFAULT_CAMERA_1_Z = DEFAULT_PAD_1_Z + CAMERA_DISTANCE_Z

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

        # Initialize game timer and score
        self.game_time_left = DEFAULT_GAME_TIMER_MINUTES * 60 + DEFAULT_GAME_TIMER_SECONDS
        self.game_timer = {'minutes': DEFAULT_GAME_TIMER_MINUTES, 'seconds': DEFAULT_GAME_TIMER_SECONDS}
        self.score = {'0': 0, '1': 0}

        self.game_continue = True
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

                # Retrieve game state
                self.game_state = await cache.aget(self.game_channel)

                # Apply physic (update objects and apply game rules)
                await self.apply_physic(lap_duration)

                # Update game timer
                await self.update_game_timer(lap_duration)

                # Ensure tick rate
                tick_count += 1
                targeted_time = start_time + tick_rate * tick_count
                time_to_wait = targeted_time - time.time()
                if time_to_wait > 0:
                    await asyncio.sleep(time_to_wait)

                # Update game state in cache
                await cache.aset(self.game_channel, self.game_state)

                lap_start_time = time.time()

        # Send game results (as frame message ?)
        # Update profiles status and player things (is_game_ready, movement...)
        # Send game end
        # Save game history

    async def reset_physic(self):
        self.direction = 1
        self.speed = 5
        self.game_state = {
            'type': 'game_state',
            'PLAYER_0': self.player_ids[0],
            'PLAYER_1': self.player_ids[1],
            'BALL': {'x': DEFAULT_BALL_X, 'y': DEFAULT_BALL_Y, 'z': DEFAULT_BALL_Z},
            'CAMERA_0': {'x': DEFAULT_CAMERA_0_X, 'y': DEFAULT_CAMERA_0_Y, 'z': DEFAULT_CAMERA_0_Z},
            'CAMERA_1': {'x': DEFAULT_CAMERA_1_X, 'y': DEFAULT_CAMERA_1_Y, 'z': DEFAULT_CAMERA_1_Z},
            'PAD_0': {'x': DEFAULT_PAD_0_X, 'y': DEFAULT_PAD_0_Y, 'z': DEFAULT_PAD_0_Z, },
            'PAD_1': {'x': DEFAULT_PAD_1_X, 'y': DEFAULT_PAD_1_Y, 'z': DEFAULT_PAD_1_Z, },
            'TIMER': self.game_timer,
            'PLAYER_SCORE': self.score,
        }
        await cache.aset(self.game_channel, self.game_state)
    
    async def apply_physic(self, lap_duration):
        x = self.game_state['BALL']['x']

        if x >= MAP_LENGTH / 2:
            self.direction = -1
        elif x <= -MAP_LENGTH / 2:
            self.direction = 1
        self.game_state['BALL']['x'] = x + self.direction * self.speed * lap_duration
        self.time = time.time()

    async def update_game_timer(self, lap_duration):
        self.game_time_left -= lap_duration
        minutes = int(self.game_time_left // 60)
        seconds = int(self.game_time_left % 60)
        self.game_timer = {'minutes': minutes, 'seconds': seconds}

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
