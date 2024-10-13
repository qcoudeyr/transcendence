import json
import traceback
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

from profiles.models import Profile, FriendRequest

class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Events handled by the server
        self.events = {
            'chat_message': self.chat_message,
            'friend_list': self.friend_list,
            'friend_add': self.friend_add,
        }

        # Request's user
        self.user = self.scope['user']
        self.profile = await get_user_profile(self.user)

        # Add groups here
        self.chat_group = "general_chat"
        await self.channel_layer.group_add(self.chat_group, self.channel_name)
        self.notifications_group = "notifications_" + str(self.profile.pk)
        await self.channel_layer.group_add(self.notifications_group, self.channel_name)

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
                try:
                    await self.events[event_type](content)
                except Exception:
                    logging.error(traceback.format_exc())

    # Events functions here
    async def chat_message(self, content):
        if 'message' in content:
            await self.channel_layer.group_send(
                self.chat_group,
                {
                    "type": "send.chat.message",
                    "name": self.profile.name,
                    "message": content['message'],
                }
            )

    async def friend_list(self, content):
        friends = await get_friends(self.profile)
        for friend in friends:
            await self.send(text_data=json.dumps({
                'type': 'friend',
                'profile_id': friend.pk,
                'name': friend.name,
                'avatar': friend.avatar.url,
                'status': friend.status,
                })
            )

    async def friend_add(self, content):
        if 'profile_id' in content:
            to_profile = await get_id_profile(content['profile_id'])
            if to_profile is not None and to_profile.pk != self.profile.pk:
                request = await create_friend_request(self.profile, to_profile)
                if request is not None:
                    await self.channel_layer.group_send(
                        "notifications_" + str(to_profile.pk),
                        {
                            'type': 'send_friend_request',
                            'request_id': request.pk,
                        }
                    )

    # group_send functions here
    async def send_chat_message(self, event):
        message = f"[{event['name']}]: {event['message']}"

        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
            })
        )

    async def send_friend_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'request_id': event['request_id'],
            'name': self.profile.name,
            'avatar': self.profile.avatar.url,
            })
        )

# Database access from consumers
@database_sync_to_async
def get_user_profile(user):
    return user.profile

@database_sync_to_async
def get_id_profile(id):
    try:
        profile = Profile.objects.get(pk=id)
    except Exception:
        profile = None
    return profile

@database_sync_to_async
def get_friends(profile):
    return list(profile.friends.all())

@database_sync_to_async
def create_friend_request(from_profile, to_profile):
    request, created = FriendRequest.objects.get_or_create(
        from_profile=from_profile,
        to_profile=to_profile
    )
    if created:
        return request
    return None