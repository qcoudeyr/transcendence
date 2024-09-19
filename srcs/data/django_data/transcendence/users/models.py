from django.db import models
from django.contrib.auth.models import User
from os.path import splitext

from transcendence.settings import DEFAULT_AVATAR, DEFAULT_BIOGRAPHY, DEFAULT_NAME

def upload_to(instance, filename):
    return 'avatars/{id}{extension}'.format(id=self.pk, extension=splitext(filename)[1])

# Create your models here.
class Profile(models.Model):
    user = models.OneToOneField(
        User,
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