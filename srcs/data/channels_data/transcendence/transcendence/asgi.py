"""
ASGI config for transcendence project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from channels.routing import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from django_channels_jwt.middleware import JwtAuthMiddlewareStack

from events.routing import websocket_urlpatterns
from events.workers.engine import EngineConsumer
from events.workers.update import UpdateConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transcendence.settings')

django_asgi_application = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_application,
        "websocket": AllowedHostsOriginValidator(
            JwtAuthMiddlewareStack(URLRouter(websocket_urlpatterns))
        ),
        "channel": ChannelNameRouter({
            "engine-server": EngineConsumer.as_asgi(),
            "update-server": UpdateConsumer.as_asgi(),
        }),
    }
)
