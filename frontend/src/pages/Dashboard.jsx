import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CreditScoreChart from '../components/CreditScoreChart';
import TransactionHistory from '../components/TransactionHistory';
import WalletConnect from '../components/WalletConnect';

const Dashboard = () => {
  const { user } = useAuth();
  const [creditScore, setCreditScore] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [scoreRes, transactionsRes] = await Promise.all([
        fetch('/api/score/history/' + user.id),
        fetch('/api/transactions/' + user.id)
      ]);

      const scoreData = await scoreRes.json();
      const transactionsData = await transactionsRes.json();

      setCreditScore(scoreData[0]);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Here's your financial overview
        </p>
      </div>

      {/* Wallet Connection */}
      <div className="mb-8">
        <WalletConnect />
      </div>

      {/* Credit Score Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Credit Score
          </h3>
          {creditScore ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {creditScore.score}
              </div>
              <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                creditScore.riskLevel === 'LOW' 
                  ? 'bg-green-100 text-green-800'
                  : creditScore.riskLevel === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {creditScore.riskLevel} RISK
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No credit score calculated yet</p>
          )}
          <button 
            onClick={() => calculateNewScore()}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Calculate New Score
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total Transactions</span>
              <span className="font-semibold">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">SACCO</span>
              <span className="font-semibold">{user.sacco?.name || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Member Since</span>
              <span className="font-semibold">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Blockchain Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Blockchain Verification
          </h3>
          {creditScore?.onChainHash ? (
            <div className="text-center text-green-600">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-sm">Score verified on-chain</p>
            </div>
          ) : (
            <div className="text-center text-yellow-600">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-sm">Pending blockchain verification</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts and History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CreditScoreChart userId={user.id} />
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
};

export default Dashboard;