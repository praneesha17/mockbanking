# backend/accounts/views.py
from decimal import Decimal
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from .models import Account
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    AccountSerializer,
    UserProfileSerializer
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)

        return Response({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': tokens
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_account_balance(request):
    try:
        account = Account.objects.get(user=request.user)
        serializer = AccountSerializer(account)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Account.DoesNotExist:
        return Response({
            'error': 'Account not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transfer_money(request):
    recipient_account_number = request.data.get('recipient_account_number')
    amount = request.data.get('amount')
    description = request.data.get('description', '')

    if not recipient_account_number or not amount:
        return Response({
            'error': 'Recipient account number and amount are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        amount = Decimal(str(amount))
        if amount <= 0:
            return Response({
                'error': 'Amount must be greater than zero'
            }, status=status.HTTP_400_BAD_REQUEST)
    except ValueError:
        return Response({
            'error': 'Invalid amount'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            # Get sender account
            sender_account = Account.objects.select_for_update().get(user=request.user)

            # Get recipient account
            try:
                recipient_account = Account.objects.select_for_update().get(
                    account_number=recipient_account_number
                )
            except Account.DoesNotExist:
                return Response({
                    'error': 'Recipient account not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Check if sender has sufficient balance
            if sender_account.balance < amount:
                return Response({
                    'error': 'Insufficient balance'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if trying to transfer to own account
            if sender_account == recipient_account:
                return Response({
                    'error': 'Cannot transfer money to your own account'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Perform the transfer
            sender_account.balance -= amount
            recipient_account.balance += amount

            sender_account.save()
            recipient_account.save()

            # Create transaction records (we'll import this from transactions app)
            from transactions.models import Transaction

            # Create debit transaction for sender
            Transaction.objects.create(
                user=request.user,
                transaction_type='DEBIT',
                amount=amount,
                description=f"Transfer to {recipient_account.account_number}" + (
                    f" - {description}" if description else ""),
                recipient_account_number=recipient_account_number
            )

            # Create credit transaction for recipient
            Transaction.objects.create(
                user=recipient_account.user,
                transaction_type='CREDIT',
                amount=amount,
                description=f"Transfer from {sender_account.account_number}" + (
                    f" - {description}" if description else ""),
                sender_account_number=sender_account.account_number
            )

            return Response({
                'message': 'Transfer successful',
                'transaction': {
                    'amount': amount,
                    'recipient': recipient_account.user.get_full_name(),
                    'recipient_account': recipient_account_number,
                    'new_balance': float(sender_account.balance),
                    'description': description
                }
            }, status=status.HTTP_200_OK)

    except Account.DoesNotExist:
        return Response({
            'error': 'Account not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': f'Transfer failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
