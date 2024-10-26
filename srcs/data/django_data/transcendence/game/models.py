from django.db import models

# Create your models here.
class PartyQueue(models.Model):
    mode = models.CharField(max_length=20, primary_key=True)
