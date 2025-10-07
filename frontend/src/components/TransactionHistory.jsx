import React, { useState } from 'react';

const TransactionHistory = ({ transactions }) => {
  const [filter, setFilter] = useState('all');

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'status-success';
      case 'PENDING':
        return 'status-warning';
      case 'FAILED':
        return 'status-error';
      default:
        return 'status-info';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DEPOSIT':
        return '💰';
      case 'WITHDRAWAL':
        return '💸';
      case 'LOAN':
        return '🏦';
      case 'REPAYMENT':
        return '🔄';
      default:
        return '💳';
    }
  };

  const formatAmount = (amount, type) => {
    const sign = type === 'DEPOSIT' || type === 'LOAN' ? '+' : '-';
    return `${sign} KES ${amount.toLocaleString()}`;
  };

  const getAmountColor = (type) => {
    return type === 'DEPOSIT' || type === 'LOAN' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-input w-auto text-sm"
        >
          <option value="all">All Types</option>
          <option value="DEPOSIT">Deposits</option>
          <option value="WITHDRAWAL">Withdrawals</option>
          <option value="LOAN">Loans</option>
          <option value="REPAYMENT">Repayments</option>
        </select>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-4xl mb-2">💳</div>
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getTypeIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {transaction.type.toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                  {formatAmount(transaction.amount, transaction.type)}
                </p>
                <span className={`status-badge ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {transactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
            <button className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              View All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;