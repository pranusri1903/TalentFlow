from django.urls import path

from .views import (
    EmployeeDetailView, EmployeeListView, LeaveDecisionView, LeaveRequestQueueView,
    MyEmployeeProfileView, MyLeaveBalanceView, MyLeaveCancelView, MyLeaveRequestsView,
)

urlpatterns = [
    path('me/', MyEmployeeProfileView.as_view(), name='my-employee-profile'),
    path('me/leave/', MyLeaveRequestsView.as_view(), name='my-leave-requests'),
    path('me/leave/balance/', MyLeaveBalanceView.as_view(), name='my-leave-balance'),
    path('me/leave/<int:pk>/cancel/', MyLeaveCancelView.as_view(), name='my-leave-cancel'),
    path('leave/', LeaveRequestQueueView.as_view(), name='leave-queue'),
    path('leave/<int:pk>/decision/', LeaveDecisionView.as_view(), name='leave-decision'),
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
]
