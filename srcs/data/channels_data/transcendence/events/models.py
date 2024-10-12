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
class Profile(models.Model):
    user = models.OneToOneField(
        User,
        related_name='profile',
        null=False,
        on_delete=models.CASCADE
    )
    name = models.CharField(
        max_length=20,
        default=DEFAULT_NAME
    )
    biography = models.CharField(
        max_length=255,
        default=DEFAULT_BIOGRAPHY
    )
    avatar = models.ImageField(
        upload_to=upload_to,
        default=DEFAULT_AVATAR
    )