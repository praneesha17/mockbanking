# backend/accounts/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('profile/', views.get_user_profile, name='profile'),
    path('balance/', views.get_account_balance, name='balance'),
    path('transfer/', views.transfer_money, name='transfer'),
]