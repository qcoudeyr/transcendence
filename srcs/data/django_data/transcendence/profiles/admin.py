from django.contrib import admin
from .models import Profile, FriendRequest, Group, GroupRequest

# Register your models here.
admin.site.register(Profile)
admin.site.register(FriendRequest)
admin.site.register(Group)
admin.site.register(GroupRequest)