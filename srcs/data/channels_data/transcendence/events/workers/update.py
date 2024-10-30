from channels.consumer import AsyncConsumer

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