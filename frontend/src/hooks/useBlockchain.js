import { useState, useCallback } from 'react';
import { suiAPI } from '../services/api';
import suiWalletService from '../services/walletService';

const useBlockchain = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await suiWalletService.connect();
      
      if (result.success) {
        setConnected(true);
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      setLoading(true);
      const result = await suiWalletService.disconnect();
      setConnected(false);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getCreditRecords = useCallback(async (userAddress) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await suiAPI.getCreditRecords(userAddress);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyCreditScore = useCallback(async (userAddress, scoreHash) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await suiAPI.verifyCreditScore(userAddress, scoreHash);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getNetworkInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await suiAPI.getNetworkInfo();
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    connected,
    connectWallet,
    disconnectWallet,
    getCreditRecords,
    verifyCreditScore,
    getNetworkInfo,
    clearError,
    walletService: suiWalletService
  };
};

export default useBlockchain;