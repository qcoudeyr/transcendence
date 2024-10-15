from rest_framework import serializers

from profiles.models import Profile

# Create your serializers here.
class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['name', 'biography', 'avatar']

class ProfileRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['name', 'biography', 'avatar', 'id']