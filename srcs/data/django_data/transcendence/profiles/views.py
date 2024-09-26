from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated

from profiles.serializers import ProfileRetrieveSerializer, ProfileUpdateSerializer

# Create your views here.
class ProfileMeAPIView(RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        profile = self.request.user.profile
        self.check_object_permissions(self.request, profile)
        return profile

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProfileRetrieveSerializer
        if self.request.method in ['PUT', 'PATCH']:
            return ProfileUpdateSerializer
        return super().get_serializer_class()