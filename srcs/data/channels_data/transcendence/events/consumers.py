import json
import traceback
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from asgiref.sync import async_to_sync
from django.db import transaction

from profiles.models import Profile, FriendRequest, GroupRequest, Group
from events.tasks import classic_game
from game.models import PartyQueue

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
            'group_request': self.group_request,
            'group_list': self.group_list,
            'group_request_answer': self.group_request_answer,
            'group_leave': self.group_leave,
            'game_join_queue': self.game_join_queue,
            'game_ready': self.game_ready,
        }

        # Request's user
        self.user = self.scope['user']
        self.profile = await get_user_profile(self.user)
        await update_profile_status(self.profile, 'ON')
        await join_default_group(self.profile)

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

        # Notify friends when Online
        for friend in friends:
            await self.channel_layer.group_send(
                "notifications_" + str(friend.pk),
                {
                    'type': 'send.friend',
                    'profile_id': self.profile.pk,
                    'name': self.profile.name,
                    'avatar': self.profile.avatar.url,
                    'status': self.profile.get_status_display(),
                }
            )

        # Connexion always accepted, bad connexions are handled by the middleware
        await self.accept()

    async def disconnect(self, close_code):
        await update_profile_status(self.profile, 'OF')
        group = await get_profile_group(self.profile)
        await leave_profile_group(self.profile)

        # Notify group when leaving
        group_members = await get_group_members(group)
        for group_member in group_members:
            await self.channel_layer.group_send(
                "notifications_" + str(group_member.pk),
                {
                    'type': 'remove.group.member',
                    'profile_id': self.profile.pk,
                }
            )
            await self.channel_layer.group_send(
                "notifications_" + str(group_member.pk),
                {
                    'type': 'group.list',
                }
            )

        # Notify friends when Offline
        friends = await get_profile_friends(self.profile)
        for friend in friends:
            await self.channel_layer.group_send(
                "notifications_" + str(friend.pk),
                {
                    'type': 'send.friend',
                    'profile_id': self.profile.pk,
                    'name': self.profile.name,
                    'avatar': self.profile.avatar.url,
                    'status': self.profile.get_status_display(),
                }
            )

        # Clear group requests
        await delete_profile_group_request_received(self.profile)
        await delete_profile_group_requests_sent(self.profile)

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
                    'status': friend.get_status_display(),
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
            request_id = content['request_id']
            request = await get_request_id_friend_request(request_id)
            reverse_request = await get_request_id_reverse_friend_request(request_id)
            if request is not None:
                new_friend = await get_friend_request_from_profile(request)
                answer = content['answer']
                await self.channel_layer.group_send(
                    self.notifications_group,
                    {
                        'type': 'remove.friend.request',
                        'request_id': request.pk,
                    }
                )
                if reverse_request is not None:
                    await self.channel_layer.group_send(
                        "notifications_" + str(new_friend.pk),
                        {
                            'type': 'remove.friend.request',
                            'request_id': reverse_request.pk,
                        }
                    )
                await answer_friend_request(request=request, answer=answer)
                if answer:
                    await self.channel_layer.group_send(
                        self.notifications_group,
                        {
                            'type': 'send.friend',
                            'profile_id': new_friend.pk,
                            'name': new_friend.name,
                            'avatar': new_friend.avatar.url,
                            'status': new_friend.get_status_display(),
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
                            'status': self.profile.get_status_display(),
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

    async def group_request(self, content):
        if 'profile_id' in content:
            profile_id = content['profile_id']
            to_profile = await get_id_profile(profile_id)
            if (to_profile is not None and await are_friends(self.profile, to_profile)
                and not await are_grouped(self.profile, to_profile)):
                await self.channel_layer.group_send(
                    'notifications_' + str(to_profile.pk),
                    {
                        'type': 'send.group.request',
                        'from_profile_id': self.profile.pk,
                        'name': self.profile.name,
                        'avatar': self.profile.avatar.url,
                    }
                )

    async def group_list(self, content):
        group_members = await get_profile_group_members(self.profile)
        for group_member in group_members:
            await self.channel_layer.group_send(
                self.notifications_group,
                {
                    'type': 'send.group.member',
                    'profile_id': group_member.pk,
                    'name': group_member.name,
                    'avatar': group_member.avatar.url,
                    'status': group_member.get_status_display(),
                    'is_chief': await is_group_chief(group_member),
                }
            )

    async def group_request_answer(self, content):
        if 'answer' in content and type(content['answer']) is bool:
            await self.channel_layer.group_send(
                self.notifications_group,
                {
                    'type': 'remove.group.request',
                }
            )
            group_request = await get_profile_group_request(self.profile)
            if group_request is None:
                return
            group = await get_group_request_group(group_request)
            await delete_profile_group_request_received(self.profile)
            if group is None or not content['answer']:
                return
            await self.group_leave({})
            await update_profile_group(profile=self.profile, new_group=group)
            await self.group_list({})
            group_members = await get_profile_group_members(self.profile)
            for group_member in group_members:
                await self.channel_layer.group_send(
                    "notifications_" + str(group_member.pk),
                    {
                        'type': 'send.group.member',
                        'profile_id': self.profile.pk,
                        'name': self.profile.name,
                        'avatar': self.profile.avatar.url,
                        'status': self.profile.get_status_display(),
                        'is_chief': await is_group_chief(self.profile),
                    }
                )

    async def group_leave(self, content):
        group = await get_profile_group(self.profile)
        await leave_profile_group(self.profile)
        await join_default_group(self.profile)
        group_members = await get_group_members(group)
        # For others
        for group_member in group_members:
            await self.channel_layer.group_send(
                "notifications_" + str(group_member.pk),
                {
                    'type': 'remove.group.member',
                    'profile_id': self.profile.pk,
                }
            )
            await self.channel_layer.group_send(
                "notifications_" + str(group_member.pk),
                {
                    'type': 'group.list',
                }
            )
        # For me
        for group_member in group_members:
            await self.channel_layer.group_send(
                self.notifications_group,
                {
                    'type': 'remove.group.member',
                    'profile_id': group_member.pk,
                }
            )
        await self.channel_layer.group_send(
            self.notifications_group,
            {
                'type': 'group.list',
            }
        )

    async def game_join_queue(self, content):
        if 'mode' in content and await is_group_chief(self.profile) and self.profile.status != 'IG':
            mode = content['mode']
            group_size = await get_profile_group_size(self.profile)
            group = await get_profile_group(self.profile)
            if mode == 'CLASSIC' and group_size <= 2:
                player_ids = await create_classic_party(group.pk, group_size)

    async def game_ready(self, content):
        await update_profile_game_ready(self.profile, True)

    # group_send functions here
    async def send_chat_message(self, event):
        message = event['message'].strip()
        if len(message) <= 0:
            return
        message = f"[{event['name']}]: {message}"

        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message
            })
        )

    async def send_private_chat_message(self, event):
        message = event['message'].strip()
        if len(message) <= 0:
            return
        message = f"[{event['name']}]: {message}"

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
            'type': 'friend_remove',
            'profile_id': event['profile_id'],
            })
        )
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

    async def send_group_request(self, event):
        from_profile = await get_id_profile(event['from_profile_id'])
        to_group = await get_profile_group(from_profile)

        # Remove old group requests received
        await delete_profile_group_request_received(self.profile)
        await self.send(text_data=json.dumps({
            'type': 'group_request_remove',
            })
        )

        group_request = await create_group_request(from_profile=from_profile, to_profile=self.profile, to_group=to_group)
        await self.send(text_data=json.dumps({
            'type': 'group_request',
            'name': event['name'],
            'avatar': event['avatar'],
            })
        )

    async def send_group_member(self, event):
        await self.send(text_data=json.dumps({
            'type': 'group_member_remove',
            'profile_id': event['profile_id'],
            })
        )
        await self.send(text_data=json.dumps({
            'type': 'group_member',
            'profile_id': event['profile_id'],
            'name': event['name'],
            'avatar': event['avatar'],
            'status': event['status'],
            'is_chief': event['is_chief'],
            })
        )

    async def remove_group_member(self, event):
        await self.send(text_data=json.dumps({
            'type': 'group_member_remove',
            'profile_id': event['profile_id'],
            })
        )

    async def remove_group_request(self, event):
        await self.send(text_data=json.dumps({
            'type': 'group_request_remove',
            })
        )

    async def send_game_start(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_start',
            })
        )

    async def send_game_object(self, event):
        await self.send(text_data=json.dumps({
            'type': 'game_object',
            'object': event['object'],
            'x': event['x'],
            'y': event['y'],
            'z': event['z'],
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
@transaction.atomic
def get_user_profile(user):
    return user.profile

@database_sync_to_async
@transaction.atomic
def get_id_profile(id):
    try:
        profile = Profile.objects.get(pk=id)
    except Profile.DoesNotExist:
        profile = None
    return profile

@database_sync_to_async
@transaction.atomic
def get_profile_friends(profile):
    return list(profile.friends.all())

@database_sync_to_async
@transaction.atomic
def create_friend_request(from_profile, to_profile):
    request, created = FriendRequest.objects.get_or_create(
        from_profile=from_profile,
        to_profile=to_profile
    )
    if created:
        return request
    return None

@database_sync_to_async
@transaction.atomic
def create_group_request(from_profile, to_profile, to_group):
    group = GroupRequest.objects.create(from_profile=from_profile, to_profile=to_profile, to_group=to_group)
    return group

@database_sync_to_async
@transaction.atomic
def get_profile_friend_requests(profile):
    return list(profile.friend_requests_received.all())

@database_sync_to_async
@transaction.atomic
def get_friend_request_from_profile(request):
    return request.from_profile

@database_sync_to_async
@transaction.atomic
def get_request_id_friend_request(request_id):
    try:
        request = FriendRequest.objects.get(pk=request_id)
    except FriendRequest.DoesNotExist:
        request = None
    return request

@database_sync_to_async
@transaction.atomic
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
@transaction.atomic
def are_friends(profile1, profile2):
    return profile1.friends.filter(pk=profile2.pk).exists()

@database_sync_to_async
@transaction.atomic
def remove_friendship(profile1, profile2):
    profile1.friends.remove(profile2)

@database_sync_to_async
@transaction.atomic
def update_profile_status(profile, status):
    profile.status = status
    profile.save(update_fields=['status'])

@database_sync_to_async
@transaction.atomic
def get_profile_group(profile):
    return profile.group

@database_sync_to_async
@transaction.atomic
def join_default_group(profile):
    profile.group, created = Group.objects.get_or_create(chief=profile)
    profile.save(update_fields=['group'])

@database_sync_to_async
@transaction.atomic
def leave_profile_group(profile):
    group = profile.group
    if group:
        profile.group = None
        profile.save(update_fields=['group'])
        if group.chief == profile:
            group.refresh_from_db()
            if group.members.count() > 0:
                group.chief = group.members.first()
                group.save(update_fields=['chief'])
            else:
                group.delete()

@database_sync_to_async
@transaction.atomic
def delete_profile_group_request_received(profile):
    try:
        group_request = GroupRequest.objects.get(pk=profile.group_request_received.pk)
        group_request.delete()
    except GroupRequest.DoesNotExist:
        pass

@database_sync_to_async
@transaction.atomic
def delete_profile_group_requests_sent(profile):
    group_requests = list(profile.group_requests_sent.all())
    for group_request in group_requests:
        group_request.delete()

@database_sync_to_async
@transaction.atomic
def are_grouped(profile_1, profile_2):
    if profile_1.group == profile_2.group:
        return True
    return False

@database_sync_to_async
@transaction.atomic
def is_group_chief(profile):
    if profile.group is not None:
        if profile.group.chief == profile:
            return True
    return False

@database_sync_to_async
@transaction.atomic
def get_profile_group_members(profile):
    if profile.group == None:
        return []
    return list(profile.group.members.all())

@database_sync_to_async
@transaction.atomic
def get_profile_group_request(profile):
    if hasattr(profile, "group_request_received"):
        return profile.group_request_received

@database_sync_to_async
@transaction.atomic
def get_group_request_group(group_request):
    try:
        group = Group.objects.get(pk=group_request.to_group.pk)
    except Group.DoesNotExist:
        group = None
    return group

@database_sync_to_async
@transaction.atomic
def update_profile_group(profile, new_group):
    # async_to_sync(leave_profile_group)(profile)
    group = profile.group
    if group:
        profile.group = None
        profile.save(update_fields=['group'])
        if group.chief == profile:
            group.refresh_from_db()
            if group.members.count() > 0:
                group.chief = group.members.first()
                group.save(update_fields=['chief'])
            else:
                group.delete()
    profile.group = new_group
    profile.save(update_fields=['group'])

@database_sync_to_async
@transaction.atomic
def get_group_members(group):
    try:
        group = Group.objects.get(pk=group.pk)
        group_members = list(group.members.all())
    except Group.DoesNotExist:
        group_members = []
    return group_members

@database_sync_to_async
@transaction.atomic
def get_request_id_reverse_friend_request(request_id):
    try:
        request = FriendRequest.objects.get(pk=request_id)
        reverse_request = FriendRequest.objects.get(from_profile=request.to_profile, to_profile=request.from_profile)
    except FriendRequest.DoesNotExist:
        reverse_request = None
    return reverse_request

@database_sync_to_async
@transaction.atomic
def get_profile_group_size(profile):
    size = 0
    if profile.group is not None:
        size = len(profile.group.members.all())
    return size

@database_sync_to_async
@transaction.atomic
def create_classic_party(new_group_id, new_group_size):
    player_ids = []
    group_sizes = {new_group_id: new_group_size}
    queue, created = PartyQueue.objects.get_or_create(mode='CLASSIC')

    if new_group_size != 2:
        if hasattr(queue, 'groups') and len(queue.groups.all()) != 0:
            group = queue.groups.first()
            group_sizes[group.pk] = len(group.members.all())
        else:
            new_group = Group.objects.get(pk=new_group_id)
            new_group.party_queue = queue
            new_group.save(update_fields=['party_queue'])

    player_quantity = sum(group_sizes.values())
    if player_quantity == 2:
        for group_id in group_sizes:
            group = Group.objects.get(pk=group_id)
            group.party_queue = None
            group.save(update_fields=['party_queue'])
            for member in list(group.members.all()):
                player_ids.append(member.pk)
        classic_game.delay(player_ids)

    return player_ids

@database_sync_to_async
@transaction.atomic
def update_profile_game_ready(profile, is_game_ready):
    profile.is_game_ready = is_game_ready
    profile.save(update_fields=['is_game_ready'])
