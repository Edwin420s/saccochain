import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionAPI } from '../services/api';

const CreateTransaction = ({ onTransactionCreated }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    type: 'DEPOSIT',
    amount: '',
    description: ''
  });

  const transactionTypes = [
    { value: 'DEPOSIT', label: 'Deposit', icon: '💰' },
    { value: 'WITHDRAWAL', label: 'Withdrawal', icon: '💸' },
    { value: 'LOAN', label: 'Loan', icon: '🏦' },
    { value: 'REPAYMENT', label: 'Repayment', icon: '🔄' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        userId: user.id
      };

      const response = await transactionAPI.create(transactionData);
      
      if (onTransactionCreated) {
        onTransactionCreated(response.data);
      }

      // Reset form and close modal
      setFormData({
        type: 'DEPOSIT',
        amount: '',
        description: ''
      });
      setIsOpen(false);
      
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    const typeConfig = transactionTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : '💳';
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary flex items-center space-x-2"
      >
        <span>+</span>
        <span>New Transaction</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Transaction
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Transaction Type */}
              <div>
                <label className="form-label">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {transactionTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`flex items-center space-x-2 p-3 border rounded-lg text-left transition-colors ${
                        formData.type === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="form-label">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  className="form-input"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter transaction description..."
                  rows="3"
                  className="form-input"
                />
              </div>

              {/* Preview */}
              {formData.amount && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    Transaction Preview
                  </h4>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getTypeIcon(formData.type)}</span>
                      <div>
                        <p className="font-medium capitalize">{formData.type.toLowerCase()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formData.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <p className={`text-lg font-semibold ${
                      formData.type === 'DEPOSIT' || formData.type === 'LOAN'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formData.type === 'DEPOSIT' || formData.type === 'LOAN' ? '+' : '-'}
                      KES {parseFloat(formData.amount).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.amount}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    'Create Transaction'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateTransaction;