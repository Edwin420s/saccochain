import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const WalletConnect = () => {
  const { user, updateUser } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallet, setWallet] = useState(null);

  // Check if Sui wallet is available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.suiWallet) {
      setWallet(window.suiWallet);
    }
  }, []);

  const connectWallet = async () => {
    if (!wallet) {
      alert('Sui wallet not found. Please install a Sui wallet extension.');
      return;
    }

    setIsConnecting(true);
    try {
      // Request connection
      await wallet.requestPermissions();
      
      // Get wallet address
      const accounts = await wallet.getAccounts();
      const address = accounts[0];

      // Update user profile with wallet address
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ walletAddress: address })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        alert('Wallet connected successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await wallet.disconnect();
      
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ walletAddress: null })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        alert('Wallet disconnected successfully!');
      }
    } catch (error) {
      console.error('Wallet disconnection error:', error);
    }
  };

  if (!wallet) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Sui wallet not detected. Please install a Sui wallet extension to connect.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Wallet Connection
      </h3>
      
      {user.walletAddress ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Connected Wallet</p>
              <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                {user.walletAddress.slice(0, 10)}...{user.walletAddress.slice(-8)}
              </p>
            </div>
            <div className="text-green-600">✅</div>
          </div>
          <button
            onClick={disconnectWallet}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
          >
            Disconnect Wallet
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Connect your Sui wallet to enable blockchain features
          </p>
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Connect Sui Wallet'}
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;