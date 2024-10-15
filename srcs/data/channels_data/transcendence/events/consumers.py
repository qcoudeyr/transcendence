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
            'friend_request': self.friend_request,
            'friend_request_list': self.friend_request_list,
            'friend_request_answer': self.friend_request_answer,
            'friend_remove': self.friend_remove,
            'chat_private_message': self.chat_private_message,
        }

        # Request's user
        self.user = self.scope['user']
        self.profile = await get_user_profile(self.user)

        # Add groups here
        self.chat_group = "general_chat"
        await self.channel_layer.group_add(self.chat_group, self.channel_name)
        self.notifications_group = "notifications_" + str(self.profile.pk)
        await self.channel_layer.group_add(self.notifications_group, self.channel_name)
        self.private_groups = {}
        friends = await get_profile_friends(self.profile)
        for friend in friends:
            logging.error('[' + str(friend.pk) + ']')
            await self.join_friend_channel(friend_pk=friend.pk)

        # Connexion always accepted, bad connexions are handled by the middleware
        await self.accept()

    async def disconnect(self, close_code):
        pass

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

    # Received events functions here
    async def chat_message(self, content):
        if 'message' in content and type(content['message']) is str:
            await self.channel_layer.group_send(
                self.chat_group,
                {
                    'type': 'send.chat.message',
                    'name': self.profile.name,
                    'message': content['message'],
                }
            )

    async def friend_list(self, content):
        friends = await get_profile_friends(self.profile)
        for friend in friends:
            await self.channel_layer.group_send(
                self.notifications_group,
                {
                    'type': 'send.friend',
                    'profile_id': friend.pk,
                    'name': friend.name,
                    'avatar': friend.avatar.url,
                    'status': friend.status,
                }
            )

    async def friend_request(self, content):
        if 'profile_id' in content and type(content['profile_id']) is int:
            to_profile = await get_id_profile(content['profile_id'])
            if to_profile is not None and to_profile.pk != self.profile.pk and not (await are_friends(to_profile, self.profile)):
                request = await create_friend_request(from_profile=self.profile, to_profile=to_profile)
                if request is not None:
                    await self.channel_layer.group_send(
                        "notifications_" + str(to_profile.pk),
                        {
                            'type': 'send.friend.request',
                            'request_id': request.pk,
                            'name': self.profile.name,
                            'avatar': self.profile.avatar.url,
                        }
                    )

    async def friend_request_list(self, content):
        requests = await get_profile_friend_requests(self.profile)
        for request in requests:
            from_profile = await get_friend_request_from_profile(request)
            await self.channel_layer.group_send(
                self.notifications_group,
                {
                    'type': 'send.friend.request',
                    'request_id': request.pk,
                    'name': from_profile.name,
                    'avatar': from_profile.avatar.url,
                }
            )

    async def friend_request_answer(self, content):
        if ('answer' in content and type(content['answer']) is bool 
            and 'request_id' in content and type(content['request_id']) is int):
            request = await get_request_id_friend_request(content['request_id'])
            if request is not None:
                answer = content['answer']
                await self.channel_layer.group_send(
                    self.notifications_group,
                    {
                        'type': 'remove.friend.request',
                        'request_id': request.pk
                    }
                )
                await answer_friend_request(request=request, answer=answer)
                if answer:
                    new_friend = await get_friend_request_from_profile(request)
                    await self.channel_layer.group_send(
                        self.notifications_group,
                        {
                            'type': 'send.friend',
                            'profile_id': new_friend.pk,
                            'name': new_friend.name,
                            'avatar': new_friend.avatar.url,
                            'status': new_friend.status,
                            'new_friend': True
                        }
                    )
                    await self.channel_layer.group_send(
                        'notifications_' + str(new_friend.pk),
                        {
                            'type': 'send.friend',
                            'profile_id': self.profile.pk,
                            'name': self.profile.name,
                            'avatar': self.profile.avatar.url,
                            'status': self.profile.status,
                            'new_friend': True
                        }
                    )

    async def friend_remove(self, content):
        if 'profile_id' in content and type(content['profile_id']) is int:
            request_profile = await get_id_profile(content['profile_id'])
            if (await are_friends(self.profile, request_profile)):
                await remove_friendship(self.profile, request_profile)
                await self.channel_layer.group_send(
                    self.notifications_group,
                    {
                        'type': 'remove.friend',
                        'profile_id': request_profile.pk,
                    }
                )
                await self.channel_layer.group_send(
                    'notifications_' + str(request_profile.pk),
                    {
                        'type': 'remove.friend',
                        'profile_id': self.profile.pk,
                    }
                )

    async def chat_private_message(self, content):
        if ('profile_id' in content and 'message' in content):
            profile_id = content['profile_id']
            to_profile = await get_id_profile(profile_id)
            if to_profile is not None and await are_friends(self.profile, to_profile):
                await self.channel_layer.group_send(
                    self.private_groups[to_profile.pk],
                    {
                        'type': 'send.private.chat.message',
                        'message': content['message'],
                        'name': self.profile.name,
                        'profile_id': self.profile.pk,
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

    async def send_private_chat_message(self, event):
        message = f"[{event['name']}]: {event['message']}"

        await self.send(text_data=json.dumps({
            'type': 'chat_private_message',
            'message': message,
            'profile_id': event['profile_id'],
            })
        )

    async def send_friend(self, event):
        if 'new_friend' in event and event['new_friend']:
            await self.join_friend_channel(friend_pk=event['profile_id'])
        await self.send(text_data=json.dumps({
            'type': 'friend',
            'profile_id': event['profile_id'],
            'name': event['name'],
            'avatar': event['avatar'],
            'status': event['status'],
            })
        )

    async def send_friend_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request',
            'request_id': event['request_id'],
            'name': event['name'],
            'avatar': event['avatar'],
            })
        )

    async def remove_friend_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request_remove',
            'request_id': event['request_id'],
            })
        )

    async def remove_friend(self, event):
        await self.leave_friend_channel(friend_pk=event['profile_id'])
        await self.send(text_data=json.dumps({
            'type': 'friend_remove',
            'profile_id': event['profile_id'],
            })
        )

    # Usefull functions
    async def join_friend_channel(self, friend_pk):
        # Generate unique group name for both profiles
        min_pk = min(friend_pk, self.profile.pk)
        max_pk = max(friend_pk, self.profile.pk)

        self.private_groups[friend_pk] = str(min_pk) + "_" + str(max_pk) + "_private_group"
        await self.channel_layer.group_add(self.private_groups[friend_pk], self.channel_name)

    async def leave_friend_channel(self, friend_pk):
        await self.channel_layer.group_discard(self.private_groups[friend_pk], self.channel_name)

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
def get_profile_friends(profile):
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

@database_sync_to_async
def get_profile_friend_requests(profile):
    return list(profile.friend_requests_received.all())

@database_sync_to_async
def get_friend_request_from_profile(request):
    return request.from_profile

@database_sync_to_async
def get_request_id_friend_request(request_id):
    try:
        request = FriendRequest.objects.get(pk=request_id)
    except Exception:
        request = None
    return request

@database_sync_to_async
def answer_friend_request(request, answer):
    if answer:
        request.to_profile.friends.add(request.from_profile)

    # Check for reverse friend request
    try:
        reverse = request.to_profile.friend_requests_sent.get(to_profile=request.from_profile)
        reverse.delete()
    except Exception:
        pass

    request.delete()

@database_sync_to_async
def are_friends(profile1, profile2):
    return profile1.friends.filter(pk=profile2.pk).exists()

@database_sync_to_async
def remove_friendship(profile1, profile2):
    profile1.friends.remove(profile2)
