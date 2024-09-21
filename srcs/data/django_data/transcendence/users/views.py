from rest_framework.generics import CreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User

from users.serializers import UserCreateSerializer, UserUpdateSerializer, UserRetrieveSerializer, UserDestroySerializer

# Create your views here.
class UserMeAPIView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        self.check_object_permissions(self.request, user)
        return user

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return UserRetrieveSerializer
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        # if self.request.method == 'PATCH':
        #     return UserUpdateSerializer
        if self.request.method == 'DELETE':
            return UserDestroySerializer
        return super().get_serializer_class()

    def get_serializer(self, *args, **kwargs):
        if self.request.method == 'PATCH':
            kwargs['partial'] = True
        return super().get_serializer(*args, **kwargs)

class UserRegisterAPIView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer
