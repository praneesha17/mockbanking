// frontend/src/components/TransactionCard.js

import React from 'react';
import { formatCurrency, formatDateTime } from '../utils/auth';

const TransactionCard = ({ transaction, onEdit, onDelete, showActions = false }) => {
  const isCredit = transaction.transaction_type === 'CREDIT';
  const isTransfer = transaction.recipient_account_number || transaction.sender_account_number;

  // 🔹 Improved description fallback logic
  const getDescription = () => {
    if (transaction.description) return transaction.description;

    if (isTransfer) {
      if (transaction.recipient_account_number) {
        return `Transfer to ${transaction.recipient_account_number}`;
      }
      if (transaction.sender_account_number) {
        return `Transfer from ${transaction.sender_account_number}`;
      }
    }

    return isCredit ? 'Money Received' : 'Money Sent';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Transaction Type Icon */}
          <div className={`p-2 rounded-full ${isCredit ? 'bg-green-100' : 'bg-red-100'}`}>
            {isCredit ? (
              <span role="img" aria-label="credit transaction">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
            ) : (
              <span role="img" aria-label="debit transaction">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                </svg>
              </span>
            )}
          </div>

          {/* Transaction Details */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900">
                {getDescription()}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isCredit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
              >
                {transaction.transaction_type}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-600">
              {formatDateTime(transaction.timestamp)}
            </div>

            {/* Transfer Information */}
            {isTransfer && (
              <div className="mt-2 text-xs text-gray-500">
                {transaction.recipient_account_number && (
                  <div>To: {transaction.recipient_account_number}</div>
                )}
                {transaction.sender_account_number && (
                  <div>From: {transaction.sender_account_number}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div
              className={`text-lg font-semibold ${
                isCredit ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isCredit ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </div>
            {transaction.balance_after_transaction && (
              <div className="text-xs text-gray-500">
                Balance: {formatCurrency(transaction.balance_after_transaction)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && !isTransfer && (
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit ? onEdit(transaction) : console.warn('onEdit handler not provided')}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit Transaction"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete ? onDelete(transaction) : console.warn('onDelete handler not provided')}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Transaction"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
