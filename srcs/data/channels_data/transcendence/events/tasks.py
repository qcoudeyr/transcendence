from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import time
from datetime import datetime

from profiles.models import Profile

BALL_RADIUS = 0.1
PAD_LENGTH = 0.3
GAME_HEIGHT = 0.15
MAP_LENGTH = 10
MAP_WIDTH = 2.5

channel_layer = get_channel_layer()

class GameObject:
    def __init__(self, x, y, z):
        self.x = x
        self.y = y
        self.z = z

class Ball(GameObject):
    def __init__(self, radius):
        super().__init__(0, 0, 0)
        self.radius = radius

    def set_default(self):
        self.x = 0
        self.y = GAME_HEIGHT
        self.z = 0

class Pad(GameObject):
    def __init__(self, player_id, pad_id):
        self.player_id = player_id
        self.pad_id = pad_id
        super().__init__(0, 0, 0)
        self.length = PAD_LENGTH

    def set_default(self):
        if self.pad_id == 0:
            self.x = MAP_LENGTH / 2
        if self.pad_id == 1:
            self.x = - MAP_LENGTH / 2
        self.y = GAME_HEIGHT
        self.z = MAP_WIDTH / 2
        
        player = Profile.objects.get(pk=self.player_id)
        player.pad_x = self.x
        player.pad_y = self.y
        player.pad_z = self.z
        player.save(update_fields=['pad_x', 'pad_y', 'pad_z'])

def players_broadcast(player_ids, event):
    for player_id in player_ids:
        async_to_sync(channel_layer.group_send)(
            "notifications_" + str(player_id),
            event
        )

def players_send_object(player_ids, object, name):
    players_broadcast(player_ids, {
        'type': 'send.game.object',
        'object': name,
        'x': object.x,
        'y': object.y,
        'z': object.z,
    })

@shared_task
def classic_game(player_ids):
    if len(player_ids) != 2:
        return
    # Game objects
    ball = Ball(BALL_RADIUS)
    pad_0 = Pad(player_ids[0], 0)
    pad_1 = Pad(player_ids[1], 1)

    ball.set_default()
    pad_0.set_default()
    pad_1.set_default()

    # Send game start
    players_broadcast(player_ids, {'type': 'send.game.start'})

    # Wait for players
    players_ready = False
    while (not players_ready):
        players_ready = True
        for player_id in player_ids:
            player = Profile.objects.get(pk=player_id)
            if not player.is_game_ready:
                players_ready = False

        time.sleep(0.1)

    game_continue = True
    while (game_continue):
        # Set and send objects initial position
        ball.set_default()
        pad_0.set_default()
        pad_1.set_default()
        players_send_object(player_ids, ball, 'BALL')
        players_send_object(player_ids, pad_0, 'PAD_0')
        players_send_object(player_ids, pad_1, 'PAD_1')

        # Send round start
        # for i in range(3, 0, -1):
        #     players_broadcast(player_ids, {'type': 'send.frame.message', 'message': str(i)})
        #     time.sleep(1)
        # players_broadcast(player_ids, {'type': 'send.frame.message', 'message': 'Fight !'})

        round_continue = True
        direction = 1
        speed = 5
        time_start = time.time()
        while (round_continue):
            time_end = time.time()
            # Set pads positions
            # pad_0.set_position()
            # pad_1.set_position()

            # Apply physic (set new positions)
            if ball.x >= MAP_LENGTH / 2 or ball.x <= -MAP_LENGTH / 2:
                direction *= -1
            time_delta = time_end - time_start
            time_start = time.time()
            ball.x += direction * speed * time_delta

            # Send objects position
            players_send_object(player_ids, ball, 'BALL')
            players_send_object(player_ids, pad_0, 'PAD_0')
            players_send_object(player_ids, pad_1, 'PAD_1')

            time.sleep(0.001)

    # Send game results (as frame message ?)
    # Update profiles status and player things (is_game_ready, movement...)
    # Send game end
    # Save game history
