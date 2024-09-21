from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password

from users.models import Profile

# Create your serializers here.
class UserCreateSerializer(serializers.Serializer):
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

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({'password': 'Different passwords.'})
        return data

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
        required=True,
        write_only=True
    )
    new_password = serializers.CharField(
        write_only=True,
        validators=[validate_password]
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'new_password']

    def validate_password(self, value):
        user = self.instance
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value

    def validate(self, attrs):
        if 'password' not in attrs:
            raise serializers.ValidationError("Password needed.")
        return super().validate(attrs)

    def update(self, instance, validated_data):
        if 'username' in validated_data:
            instance.username = validated_data['username']
        if 'email' in validated_data:
            instance.email = validated_data['email']
        if 'new_password' in validated_data:
            instance.set_password(validated_data['new_password'])
        instance.save()
        return instance

class UserRetrieveSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']

class UserDestroySerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        required=True,
        write_only=True
    )

    class Meta:
        model = User
        fields = ['password']

    def validate_password(self, value):
        user = self.instance
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect password.")
        return value

    def validate(self, attrs):
        if 'password' not in attrs:
            raise serializers.ValidationError("Password needed.")
        return super().validate(attrs)

    def delete(self):
        user = self.instance
        user.delete()
