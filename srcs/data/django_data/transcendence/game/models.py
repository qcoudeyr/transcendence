from django.db import models

# Create your models here.
class PartyQueue(models.Model):
    mode = models.CharField(max_length=20, primary_key=True)

class GameHistory(models.Model):
    players = models.ManyToManyField("profiles.Profile")
    winner_id = models.IntegerField(null=True, default=None)
    player_0_id = models.IntegerField(null=True)
    player_1_id = models.IntegerField(null=True)
    score_0 = models.IntegerField(default=0)
    score_1 = models.IntegerField(default=0)
    is_in_progress = models.BooleanField(default=True)
    date = models.DateField(auto_now_add=True)