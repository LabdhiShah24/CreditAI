from django.contrib import admin
from django.urls import path
from accounts.views import home, register, user_login, user_logout, dashboard, credit_form, history, assessment_detail

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home),
    path("register/", register),
    path("login/", user_login, name="login"),
    path("logout/", user_logout, name="logout"),
    path("dashboard/", dashboard, name="dashboard"),
    path('credit-form/', credit_form, name="credit_form"),
    path('history/', history, name="history"),
    path('history/<int:pk>/', assessment_detail, name="assessment_detail"),
]