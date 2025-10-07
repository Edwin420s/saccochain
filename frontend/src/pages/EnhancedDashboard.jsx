import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CreditScoreChart from '../components/CreditScoreChart';
import TransactionHistory from '../components/TransactionHistory';
import WalletConnect from '../components/WalletConnect';
import CreateTransaction from '../components/CreateTransaction';
import { creditScoreAPI, transactionAPI } from '../services/api';

const EnhancedDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [creditScore, setCreditScore] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculatingScore, setCalculatingScore] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [scoreRes, transactionsRes] = await Promise.all([
        creditScoreAPI.getHistory(user.id),
        transactionAPI.getUserTransactions(user.id, { limit: 10 })
      ]);

      const scoreData = await scoreRes.data;
      const transactionsData = await transactionsRes.data;

      setCreditScore(scoreData[0]);
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateScore = async () => {
    try {
      setCalculatingScore(true);
      const response = await creditScoreAPI.calculate(user.id);
      const newScore = response.data;
      
      setCreditScore(newScore);
      await fetchDashboardData(); // Refresh data
      
      // Show success message
      alert('Credit score calculated successfully!');
    } catch (error) {
      console.error('Error calculating credit score:', error);
      alert('Failed to calculate credit score. Please try again.');
    } finally {
      setCalculatingScore(false);
    }
  };

  const handleTransactionCreated = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    // Recalculate credit score after new transaction
    setTimeout(handleCalculateScore, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome', { name: user.name })}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {t('dashboard.overview')}
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <WalletConnect />
          <CreateTransaction onTransactionCreated={handleTransactionCreated} />
        </div>
        
        <button
          onClick={handleCalculateScore}
          disabled={calculatingScore}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50"
        >
          {calculatingScore ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <span>🔄</span>
          )}
          <span>
            {calculatingScore ? 'Calculating...' : t('dashboard.calculateNewScore')}
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Credit Score Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.creditScore')}
          </h3>
          {creditScore ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {creditScore.score}
              </div>
              <div className={`status-badge ${
                creditScore.riskLevel === 'LOW' 
                  ? 'status-success'
                  : creditScore.riskLevel === 'MEDIUM'
                  ? 'status-warning'
                  : 'status-error'
              }`}>
                {creditScore.riskLevel} RISK
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Last updated: {new Date(creditScore.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-500 dark:text-gray-400">
                {t('dashboard.noScore')}
              </p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.quickStats')}
          </h3>
          <div className="space-y-4">
            <StatItem 
              label={t('dashboard.totalTransactions')}
              value={transactions.length}
              icon="💳"
            />
            <StatItem 
              label="SACCO"
              value={user.sacco?.name || 'Not assigned'}
              icon="🏦"
            />
            <StatItem 
              label={t('dashboard.memberSince')}
              value={new Date(user.createdAt).toLocaleDateString()}
              icon="📅"
            />
          </div>
        </div>

        {/* Blockchain Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('dashboard.blockchainVerification')}
          </h3>
          <div className="text-center py-4">
            {user.walletAddress ? (
              creditScore?.onChainHash ? (
                <div className="text-green-600">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="font-medium">{t('dashboard.scoreVerified')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Verified on Sui Blockchain
                  </p>
                </div>
              ) : (
                <div className="text-yellow-600">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="font-medium">{t('dashboard.pendingVerification')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Connect wallet to verify
                  </p>
                </div>
              )
            ) : (
              <div className="text-gray-500">
                <div className="text-4xl mb-2">🔗</div>
                <p className="font-medium">Connect Wallet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enable blockchain features
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditScoreChart userId={user.id} />
        <TransactionHistory transactions={transactions} />
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <ActivityItem key={transaction.id} transaction={transaction} />
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📝</div>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Stat Item Component
const StatItem = ({ label, value, icon }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center space-x-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
    </div>
    <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

// Activity Item Component
const ActivityItem = ({ transaction }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'DEPOSIT': return '💰';
      case 'WITHDRAWAL': return '💸';
      case 'LOAN': return '🏦';
      case 'REPAYMENT': return '🔄';
      default: return '💳';
    }
  };

  const getActivityColor = (type) => {
    return type === 'DEPOSIT' || type === 'LOAN' 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getActivityIcon(transaction.type)}</span>
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
        <p className={`font-semibold ${getActivityColor(transaction.type)}`}>
          {transaction.type === 'DEPOSIT' || transaction.type === 'LOAN' ? '+' : '-'}
          KES {transaction.amount.toLocaleString()}
        </p>
        <span className={`status-badge ${
          transaction.status === 'COMPLETED' 
            ? 'status-success'
            : transaction.status === 'PENDING'
            ? 'status-warning'
            : 'status-error'
        }`}>
          {transaction.status}
        </span>
      </div>
    </div>
  );
};

export default EnhancedDashboard;