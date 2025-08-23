from django.urls import path
from .views import me, token_obtain_pair, token_refresh

urlpatterns = [
    path("me/", me),
    path("token/", token_obtain_pair),
    path("token/refresh/", token_refresh),
]
