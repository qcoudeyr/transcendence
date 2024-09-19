from rest_framework.permissions import BasePermission
import os

# Create your permissions here.
class IsDetailUser(BasePermission):
    def has_permission(self, request, view):
        detail_pk = os.path.basename(os.path.normpath(request.path))
        return bool(request.user and detail_pk == str(request.user.pk))