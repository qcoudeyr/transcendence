import time
import asyncio

from channels.layers import get_channel_layer
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async

from profiles.models import Profile

BALL_RADIUS = 0.1
PAD_LENGTH = 0.3
GAME_HEIGHT = 0.15
MAP_LENGTH = 10
MAP_WIDTH = 2.5
TICK_RATE = 1.0 / 60

channel_layer = get_channel_layer()

class PongEngine:
    def __init__(self, game_id, player_ids):
        self.game_id = game_id
        self.player_ids = player_ids

    async def game_loop(self):
        # Send game start
        await channel_layer.group_send(
            'game_' + str(self.game_id),
            {'type': 'send.game.start'}
        )

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
            }
        )

        game_continue = True
        while (game_continue):
            # Initialize game objects

            # Send round start
            # for i in range(3, 0, -1):
            #     players_broadcast(player_ids, {'type': 'send.frame.message', 'message': str(i)})
            #     time.sleep(1)
            # players_broadcast(player_ids, {'type': 'send.frame.message', 'message': 'Fight !'})

            # Tick rate setup
            tick_rate = TICK_RATE
            tick_count = 0
            start_time = time.time()

            round_continue = True
            while (round_continue):
                # Apply physic (update objects)
                await self.apply_physic()

                # Ensure tick rate
                tick_count += 1
                targeted_time = start_time + tick_rate * tick_count
                time_to_wait = targeted_time - time.time()
                if time_to_wait > 0:
                    await asyncio.sleep(time_to_wait)

        # Send game results (as frame message ?)
        # Update profiles status and player things (is_game_ready, movement...)
        # Send game end
        # Save game history

class EngineConsumer(AsyncConsumer):
    async def classic_game(self, event):
        if 'player_ids' in event and 'game_id' in event:
            game_id = event['game_id']
            player_ids = event['player_ids']
        else:
            return

        # Create game instance
        engine = PongEngine(game_id, player_ids)
        await engine.game_loop()

