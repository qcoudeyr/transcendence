"""
URL configuration for transcendence project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from users.views import UserMeAPIView, UserRegisterAPIView, MediaAuthAPIView
from profiles.views import ProfileMeAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/media/auth/', MediaAuthAPIView, name='media-auth'),
    path('api/tokenRefresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('api/user/login/', TokenObtainPairView.as_view(), name='user-login'),
    path('api/user/register/', UserRegisterAPIView.as_view(), name='user-register'),
    path('api/user/me/', UserMeAPIView.as_view(), name='user-me'),
    path('api/profile/me/', ProfileMeAPIView.as_view(), name='profile-me'),
]
