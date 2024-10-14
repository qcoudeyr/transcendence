from django.db import models
from django.contrib.auth.models import User
from os.path import splitext

# Default profile values
DEFAULT_NAME = 'Recruit'
DEFAULT_AVATAR = 'default/avatar/sen.png'
DEFAULT_BIOGRAPHY = 'A l\'huile !'


def upload_to(instance, filename):
    return '{id}/avatar/{filename}'.format(id=instance.user.pk, filename=filename)

# Create your models here.
class FriendRequest(models.Model):
    to_profile = models.ForeignKey(
        "Profile",
        on_delete=models.CASCADE,
        related_name="friend_requests_received",
    )
    from_profile = models.ForeignKey(
        "Profile",
        on_delete=models.CASCADE,
        related_name="friend_requests_sent",
    )

class Group(models.Model):
    chief = models.OneToOneField(
        "Profile",
        on_delete=models.PROTECT,
        related_name="group_chief",
    )

class GroupRequest(models.Model):
    to_group = models.ForeignKey(
        "Group",
        on_delete=models.CASCADE,
        related_name="group_requests_received",
    )
    from_profile = models.ForeignKey(
        "Profile",
        on_delete=models.CASCADE,
        related_name="group_requests_sent",
    )

class Profile(models.Model):
    OFFLINE = "OF"
    ONLINE = "ON"
    INGAME = "IG"
    STATUS_CHOICES = {
        OFFLINE: "Offline",
        ONLINE: "Online",
        INGAME: "In Game",
    }

    user = models.OneToOneField(
        User,
        related_name='profile',
        null=False,
        on_delete=models.CASCADE,
    )
    name = models.CharField(
        max_length=20,
        null=False,
        default=DEFAULT_NAME,
    )
    biography = models.CharField(
        max_length=255,
        null=False,
        default=DEFAULT_BIOGRAPHY,
    )
    avatar = models.ImageField(
        upload_to=upload_to,
        null=False,
        default=DEFAULT_AVATAR,
    )
    status = models.CharField(
        max_length=2,
        choices=STATUS_CHOICES,
        default=OFFLINE,
    )
    friends = models.ManyToManyField("self")
    group = models.ForeignKey(
        "Group",
        on_delete=models.PROTECT,
        related_name="members",
        null=True
    )
