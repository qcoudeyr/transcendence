import time
import asyncio

from channels.consumer import AsyncConsumer
from channels.layers import get_channel_layer
from django.core.cache import cache

channel_layer = get_channel_layer()

TICK_RATE = 1.0 / 96

async def update_loop(game_channel):
    # Tick rate setup
    tick_rate = TICK_RATE
    tick_count = 0
    start_time = time.time()

    update_continue = True
    while (update_continue):
        # Retrieve and send game state
        game_state = await cache.aget(game_channel)
        await channel_layer.group_send(
            game_channel,
            game_state
        )
        if game_state['ENDED']:
            update_continue = False

        # Ensure tick rate
        tick_count += 1
        targeted_time = start_time + tick_rate * tick_count
        time_to_wait = targeted_time - time.time()
        if time_to_wait > 0:
            await asyncio.sleep(time_to_wait)

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
            game_channel = event['game_channel']
        else:
            return
        asyncio.create_task(update_loop(game_channel))
