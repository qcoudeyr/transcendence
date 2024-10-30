from django.db import models

# Create your models here.
class PartyQueue(models.Model):
    mode = models.CharField(max_length=20, primary_key=True)

class GameHistory(models.Model):
    players = models.ManyToManyField("profiles.Profile")
    winner = models.OneToOneField(
        "profiles.Profile",
        on_delete=models.PROTECT,
        related_name='game_history_winner',
        null=True,
    )
    score_0 = models.IntegerField(default=0)
    score_1 = models.IntegerField(default=0)