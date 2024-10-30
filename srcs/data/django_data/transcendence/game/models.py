from django.db import models

# Create your models here.
class PartyQueue(models.Model):
    mode = models.CharField(max_length=20, primary_key=True)

class GameHistory(models.Model):
    player_0 = models.OneToOneField(
        "profiles.Profile",
        on_delete=models.PROTECT,
    )
    player_1 = models.OneToOneField(
        "profiles.Profile",
        on_delete=models.PROTECT,
    )
    winner = models.OneToOneField(
        "profiles.Profile",
        on_delete=models.PROTECT,
        null=True,
    )
    score_0 = models.IntegerField(default=0)
    score_1 = models.IntegerField(default=0)