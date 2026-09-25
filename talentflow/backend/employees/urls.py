from django.urls import path

from .views import EmployeeDetailView, EmployeeListView, MyEmployeeProfileView

urlpatterns = [
    path('me/', MyEmployeeProfileView.as_view(), name='my-employee-profile'),
    path('', EmployeeListView.as_view(), name='employee-list'),
    path('<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
]
