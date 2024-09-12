from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    display_name = models.CharField(max_length=150, unique=True)
    # Add any additional fields if necessary

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png')
    status = models.CharField(max_length=20, default='offline')
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    # Add any additional fields you need
