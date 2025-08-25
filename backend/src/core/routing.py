from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/gestures/", consumers.GestureConsumer.as_asgi()),
]
