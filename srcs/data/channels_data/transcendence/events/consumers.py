import json

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Profile

class EventConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        # Events handled by the server
        self.events = {
            'chat_message': self.chat_message,
        }

        # Request's user
        self.user = self.scope['user']

        # Connect to the general chat by default
        self.chat_group = "general_chat"
        await self.channel_layer.group_add(self.chat_group, self.channel_name)

        # Connexion always accepted, bad connexions are handled by the middleware
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.chat_group, self.channel_name)

    async def receive(self, text_data):
        try:
            content = json.loads(text_data)
        except json.decoder.JSONDecodeError:
            content = {}
        # Do nothing if there is no type in the content, or the event type is unknown
        if 'type' in content:
            event_type = content.pop('type')

            if event_type in self.events:
                await self.events[event_type](content)

    # Events functions here
    async def chat_message(self, content):
        if 'message' in content:
            # name = await get_profile_name(self.user)
            name = user.username
            await self.channel_layer.group_send(
                self.chat_group,
                {
                    "type": "send.chat.message",
                    "name": name,
                    "message": content['message']
                }
            )

    async def send_chat_message(self, event):
        message = f"[{self.user.username}]: {event['message']}"

        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
            })
        )

@database_sync_to_async
def get_profile_name(user):
    user.refresh_from_db()
    return Profile.objects.get(user=user)