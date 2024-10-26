from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from time import sleep

channel_layer = get_channel_layer()

@shared_task
def reply_bot(reply_channel):
    while (1):
        async_to_sync(channel_layer.send)(reply_channel, {
            'type': 'send.chat.message',
            'name': 'TASK',
            'message': 'Hey buddy ! 3s.',
        })
        sleep(0.01)