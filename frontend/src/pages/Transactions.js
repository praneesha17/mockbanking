import React, { useState, useEffect } from 'react';
import { transactionAPI } from '../services/api';
import { Loader2, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils/auth';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  const fetchTransactions = async (pageNum = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await transactionAPI.getTransactions({ page: pageNum });

      // Extract transactions and summary
      const txnArray = response?.results?.transactions || [];
      const txnSummary = response?.results?.summary || {};

      setTransactions((prev) => (pageNum === 1 ? txnArray : [...prev, ...txnArray]));
      setSummary(txnSummary);
      setHasNext(!!response.next);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transactions.');
      setTransactions([]);
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = (transactions || []).filter((txn) =>
    (txn.description || '').toLowerCase().includes(filter.toLowerCase()) ||
    (txn.recipient_account_number || '').toLowerCase().includes(filter.toLowerCase()) ||
    (txn.sender_account_number || '').toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Transactions</h2>

      {/* Summary */}
      {summary && (
        <div className="flex gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg shadow flex-1">
            <p className="text-gray-500 text-sm">Total Transactions</p>
            <p className="text-lg font-bold">{summary.total_transactions || 0}</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow flex-1">
            <p className="text-gray-500 text-sm">Total Credits</p>
            <p className="text-lg font-bold">
              {summary.total_credits || 0} ({formatCurrency(summary.total_credit_amount || 0)})
            </p>
          </div>
          <div className="bg-red-100 p-4 rounded-lg shadow flex-1">
            <p className="text-gray-500 text-sm">Total Debits</p>
            <p className="text-lg font-bold">
              {summary.total_debits || 0} ({formatCurrency(summary.total_debit_amount || 0)})
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2 mb-6">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by account or description..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading / Error / Transactions */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-blue-600" size={30} />
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : filteredTransactions.length === 0 ? (
        <p className="text-gray-500">No transactions found.</p>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((txn) => (
            <div
              key={txn.id}
              className="flex justify-between items-center bg-white p-4 rounded-xl shadow hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                {txn.transaction_type === 'CREDIT' ? (
                  <ArrowDownLeft className="text-green-600" />
                ) : (
                  <ArrowUpRight className="text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-gray-800">
                    {txn.description || (txn.transaction_type === 'CREDIT' ? 'Money Received' : 'Money Sent')}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(txn.timestamp)} •{' '}
                    {txn.recipient_account_number || txn.sender_account_number}
                  </p>
                </div>
              </div>
              <p
                className={`text-lg font-bold ${
                  txn.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {txn.transaction_type === 'CREDIT' ? '+' : '-'}
                {formatCurrency(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNext && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default Transactions;
