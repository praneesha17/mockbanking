# backend/transactions/views.py
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Transaction
from .serializers import TransactionSerializer, TransactionCreateSerializer


class TransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def transactions_view(request):
    if request.method == 'GET':
        # Get all transactions for the current user
        transactions = Transaction.objects.filter(user=request.user)

        # Apply search filter if provided
        search_query = request.query_params.get('search', None)
        if search_query:
            transactions = transactions.filter(
                Q(description__icontains=search_query) |
                Q(recipient_account_number__icontains=search_query) |
                Q(sender_account_number__icontains=search_query)
            )

        # Apply transaction type filter if provided
        transaction_type = request.query_params.get('type', None)
        if transaction_type and transaction_type in ['CREDIT', 'DEBIT']:
            transactions = transactions.filter(transaction_type=transaction_type)

        # Paginate results
        paginator = TransactionPagination()
        paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = TransactionSerializer(paginated_transactions, many=True)

        # Calculate summary statistics
        total_transactions = transactions.count()
        total_credits = transactions.filter(transaction_type='CREDIT').count()
        total_debits = transactions.filter(transaction_type='DEBIT').count()

        credit_amount = sum((t.amount for t in transactions.filter(transaction_type='CREDIT')), Decimal('0.00'))
        debit_amount = sum((t.amount for t in transactions.filter(transaction_type='DEBIT')), Decimal('0.00'))

        response_data = {
            'transactions': serializer.data,
            'summary': {
                'total_transactions': total_transactions,
                'total_credits': total_credits,
                'total_debits': total_debits,
                'total_credit_amount': credit_amount,
                'total_debit_amount': debit_amount,
            }
        }

        return paginator.get_paginated_response(response_data)

    elif request.method == 'POST':
        # Create a new transaction (manual entry)
        serializer = TransactionCreateSerializer(data=request.data)
        if serializer.is_valid():
            transaction = serializer.save(user=request.user)
            response_serializer = TransactionSerializer(transaction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def transaction_detail(request, transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id, user=request.user)
    except Transaction.DoesNotExist:
        return Response({
            'error': 'Transaction not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Only allow updating description for manual transactions
        # Transfers cannot be modified to maintain integrity
        if transaction.recipient_account_number or transaction.sender_account_number:
            return Response({
                'error': 'Transfer transactions cannot be modified'
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = TransactionCreateSerializer(transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = TransactionSerializer(transaction)
            return Response(response_serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Only allow deleting manual transactions
        if transaction.recipient_account_number or transaction.sender_account_number:
            return Response({
                'error': 'Transfer transactions cannot be deleted'
            }, status=status.HTTP_400_BAD_REQUEST)

        transaction.delete()
        return Response({
            'message': 'Transaction deleted successfully'
        }, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_statistics(request):
    transactions = Transaction.objects.filter(user=request.user)

    # Monthly spending calculation (current month)
    from django.utils import timezone
    current_month = timezone.now().month
    current_year = timezone.now().year

    monthly_debits = transactions.filter(
        transaction_type='DEBIT',
        timestamp__month=current_month,
        timestamp__year=current_year
    )

    monthly_spending = sum((t.amount for t in monthly_debits), Decimal('0.00'))

    # Recent activity (last 5 transactions)
    recent_transactions = transactions[:5]
    recent_serializer = TransactionSerializer(recent_transactions, many=True)

    return Response({
        'monthly_spending': monthly_spending,
        'recent_transactions': recent_serializer.data,
        'total_transactions': transactions.count(),
    })

