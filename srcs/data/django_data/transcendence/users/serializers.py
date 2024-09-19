from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.db import transaction

from users.models import Profile

# Create your serializers here.
class UserCreateDestroySerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    password_confirmation = serializers.CharField(
        required=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirmation']

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({'password': 'Different passwords.'})
        return data

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        Profile.objects.create(user=user)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(validators=[UniqueValidator(queryset=User.objects.all())])
    email = serializers.EmailField(validators=[UniqueValidator(queryset=User.objects.all())])
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirmation']

    def validate(self, data):
        if ('password' in data) != ('password_confirmation' in data):
            raise serializers.ValidationError({'password': 'Password need confirmation, and vice-versa.'})
        if 'password' in data and data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({'password': 'Different passwords.'})
        return data

    @transaction.atomic
    def update(self, instance, validated_data):
        if 'username' in validated_data:
            instance.name = validated_data['username']
            instance.save()
        if 'email' in validated_data:
            instance.email = validated_data['email']
            instance.save()
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        return super().update(instance, validated_data)