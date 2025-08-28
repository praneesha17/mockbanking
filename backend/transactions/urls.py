# backend/transactions/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('transactions/', views.transactions_view, name='transactions'),
    path('transactions/<int:transaction_id>/', views.transaction_detail, name='transaction_detail'),
    path('transactions/stats/', views.transaction_statistics, name='transaction_stats'),
]