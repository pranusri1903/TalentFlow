from django.urls import path

from .views import (
    MarkAllNotificationsReadView, MarkNotificationReadView, MarkPasswordChangedView, MeView,
    NotificationListView, NotificationUnreadCountView, UserDetailView, UserListCreateView,
)

urlpatterns = [
    path('me/', MeView.as_view(), name='me'),
    path('me/password-changed/', MarkPasswordChangedView.as_view(), name='password-changed'),
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/unread-count/', NotificationUnreadCountView.as_view(), name='notification-unread-count'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='notification-read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='notification-mark-all-read'),
]
