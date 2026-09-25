from django.urls import path

from .views import MarkPasswordChangedView, MeView, UserDetailView, UserListCreateView

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/password-changed/', MarkPasswordChangedView.as_view(), name='password-changed'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
