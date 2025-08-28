from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user', 'transaction_type', 'amount',
        'description', 'timestamp', 'recipient_account_number', 'sender_account_number'
    )
    search_fields = ('user__username', 'recipient_account_number', 'sender_account_number', 'description')
    list_filter = ('transaction_type', 'timestamp')
    ordering = ('-timestamp',)
    list_per_page = 20
