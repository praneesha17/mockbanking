# backend/transactions/models.py

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)

    # Optional fields for transfer tracking
    recipient_account_number = models.CharField(max_length=12, blank=True, null=True)
    sender_account_number = models.CharField(max_length=12, blank=True, null=True)

    timestamp = models.DateTimeField(auto_now_add=True)
    balance_after_transaction = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.balance_after_transaction:
            # Get the current balance after this transaction
            self.balance_after_transaction = self.user.account.balance
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - ${self.amount} on {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']
        db_table = 'transactions'