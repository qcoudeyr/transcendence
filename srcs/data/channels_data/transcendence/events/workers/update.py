import time
import asyncio

from channels.consumer import AsyncConsumer
from channels.layers import get_channel_layer
from django.core.cache import cache

channel_layer = get_channel_layer()

TICK_RATE = 1.0 / 2

class UpdateConsumer(AsyncConsumer):
    async def game_update(self, event):
        await channel_layer.group_send(
            'general_chat',
            {
                'type': 'send.chat.message',
                'name': 'update',
                'message': 'game update'
            }
        )
        if 'game_channel' in event:
            self.game_channel = event['game_channel']
        else:
            return

        # Tick rate setup
        tick_rate = TICK_RATE
        tick_count = 0
        start_time = time.time()

        round_continue = True
        while (round_continue):
            # Retrieve and send game state
            game_state = await cache.aget(self.game_channel)
            await channel_layer.group_send(
                self.game_channel,
                {
                    'type': 'send.chat.message',
                    'name': 'update server',
                    'message': game_state,
                }
            )

            # Ensure tick rate
            tick_count += 1
            targeted_time = start_time + tick_rate * tick_count
            time_to_wait = targeted_time - time.time()
            if time_to_wait > 0:
                await asyncio.sleep(time_to_wait)