from channels.consumer import AsyncConsumer
from channels.layers import get_channel_layer

channel_layer = get_channel_layer()

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