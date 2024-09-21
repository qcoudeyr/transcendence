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
        if self.request.method == 'DELETE':
            return UserDestroySerializer
        return super().get_serializer_class()

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserRegisterAPIView(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = UserCreateSerializer
