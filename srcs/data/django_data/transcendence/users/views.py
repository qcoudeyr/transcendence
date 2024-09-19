from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.models import User

from users.serializers import UserCreateDestroySerializer, UserUpdateSerializer
from users.permissions import IsDetailUser

# Create your views here.
class UserViewset(ModelViewSet):
    queryset = User.objects.all()

    def get_permissions(self):
        if self.action == 'create':
            self.permission_classes = [AllowAny]
        else:
            self.permission_classes = [IsAuthenticated, IsDetailUser]
        return super().get_permissions()

    def get_serializer_class(self):
        serializer_class = UserCreateDestroySerializer
        if self.action == 'update' or self.action == 'partial_update':
            return UserUpdateSerializer
        return serializer_class