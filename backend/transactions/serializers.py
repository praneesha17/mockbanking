# backend/transactions/serializers.py

from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    formatted_amount = serializers.SerializerMethodField()
    formatted_timestamp = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'user_name',
            'transaction_type',
            'amount',
            'formatted_amount',
            'description',
            'recipient_account_number',
            'sender_account_number',
            'timestamp',
            'formatted_timestamp',
            'balance_after_transaction'
        ]
        read_only_fields = ['id', 'timestamp', 'user_name']

    def get_formatted_amount(self, obj):
        if obj.transaction_type == 'CREDIT':
            return f"+${obj.amount:,.2f}"
        else:
            return f"-${obj.amount:,.2f}"

    def get_formatted_timestamp(self, obj):
        return obj.timestamp.strftime('%b %d, %Y')

class TransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'transaction_type',
            'amount',
            'description',
            'recipient_account_number',
            'sender_account_number'
        ]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero")
        return value