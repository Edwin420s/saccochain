import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const VerifyMember = () => {
    const { t } = useTranslation();
    const [searchType, setSearchType] = useState('userId');
    const [searchValue, setSearchValue] = useState('');
    const [verificationData, setVerificationData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setVerificationData(null);

        try {
            let endpoint = '';
            switch (searchType) {
                case 'userId':
                    endpoint = `/api/verification/member/${searchValue}`;
                    break;
                case 'wallet':
                    endpoint = `/api/verification/wallet/${searchValue}`;
                    break;
                case 'nationalId':
                    endpoint = `/api/verification/national-id/${searchValue}`;
                    break;
                default:
                    endpoint = `/api/verification/member/${searchValue}`;
            }

            const response = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            });

            setVerificationData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'LOW':
                return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'MEDIUM':
                return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
            case 'HIGH':
                return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default:
                return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('admin.verificationTitle')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('admin.verificationDescription')}
                    </p>
                </div>

                {/* Search Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
                    <form onSubmit={handleVerify}>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Search By
                                </label>
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="userId">User ID</option>
                                    <option value="wallet">Wallet Address</option>
                                    <option value="nationalId">National ID</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {searchType === 'userId' && 'Member ID'}
                                    {searchType === 'wallet' && 'Wallet Address'}
                                    {searchType === 'nationalId' && 'National ID Number'}
                                </label>
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder={
                                        searchType === 'userId' ? 'Enter member ID...' :
                                            searchType === 'wallet' ? '0x...' :
                                                'Enter national ID...'
                                    }
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                `Verify ${searchType === 'userId' ? 'Member' : searchType === 'wallet' ? 'Wallet' : 'National ID'}`
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="mt-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>

                {/* Verification Results */}
                {verificationData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* User Info Card */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                        {verificationData.user?.name}
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-400">{verificationData.user?.email}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Verified</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">National ID</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{verificationData.user?.nationalId || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Wallet Address</p>
                                    <p className="font-mono text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {verificationData.user?.walletAddress || 'Not connected'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">SACCO</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{verificationData.sacco?.name || 'N/A'}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(verificationData.user?.memberSince).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Credit Profile */}
                        {verificationData.creditProfile && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Credit Profile</h3>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Credit Score</p>
                                        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                                            {verificationData.creditProfile.latestScore || 'N/A'}
                                        </p>
                                        {verificationData.creditProfile.onChainHash && (
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Blockchain Verified</p>
                                        )}
                                    </div>

                                    <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Level</p>
                                        <p className={`text-2xl font-bold px-4 py-2 rounded-lg inline-block ${getRiskColor(verificationData.creditProfile.riskLevel)}`}>
                                            {verificationData.creditProfile.riskLevel}
                                        </p>
                                    </div>

                                    <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Last Updated</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {verificationData.creditProfile.scoreDate ?
                                                new Date(verificationData.creditProfile.scoreDate).toLocaleDateString() :
                                                'Never'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Financial Summary */}
                        {verificationData.financialSummary && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Financial Summary</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Deposits</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            KES {verificationData.financialSummary.totalDeposits?.toLocaleString() || '0'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Loans</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            KES {verificationData.financialSummary.totalLoans?.toLocaleString() || '0'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Outstanding Balance</p>
                                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                            KES {verificationData.financialSummary.outstandingBalance?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Repayment Rate</p>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(verificationData.financialSummary.repaymentRate || 0, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                            {verificationData.financialSummary.repaymentRate?.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Inter-SACCO Activity */}
                        {verificationData.interSaccoActivity && (
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-2xl shadow-lg p-6 border-2 border-cyan-200 dark:border-cyan-800">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                                    <span className="mr-2">🔗</span>
                                    Inter-SACCO Network Activity
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active in SACCOs</p>
                                        <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                                            {verificationData.interSaccoActivity.totalActiveSaccos}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Has Active Borrowings</p>
                                        <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                                            {verificationData.interSaccoActivity.hasBorrowings ? 'Yes' : 'No'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recent Transactions */}
                        {verificationData.recentTransactions && verificationData.recentTransactions.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {verificationData.recentTransactions.map((tx, index) => (
                                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{tx.type}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">KES {parseFloat(tx.amount).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                                tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                        {new Date(tx.date).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyMember;
