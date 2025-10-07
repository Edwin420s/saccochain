const express = require('express');
const blockchainService = require('../services/blockchainService');
const blockchainEventListener = require('../services/blockchainEventListener');
const { authenticateToken } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const router = express.Router();

// Get blockchain network info
router.get('/network-info', authenticateToken, async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    successResponse(res, networkInfo);
  } catch (error) {
    errorResponse(res, error.message);
  }
});

// Get user's credit records from blockchain
router.get('/credit-records/:userAddress', authenticateToken, async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    const records = await blockchainService.getCreditRecords(userAddress);
    successResponse(res, records);
  } catch (error) {
    errorResponse(res, error.message);
  }
});

// Get user's loan agreements from blockchain
router.get('/loan-agreements/:userAddress', authenticateToken, async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    const agreements = await blockchainService.getLoanAgreements(userAddress);
    successResponse(res, agreements);
  } catch (error) {
    errorResponse(res, error.message);
  }
});

// Verify credit score on blockchain
router.post('/verify-credit-score', authenticateToken, async (req, res) => {
  try {
    const { userAddress, scoreHash } = req.body;
    
    const verification = await blockchainService.verifyCreditScore(userAddress, scoreHash);
    successResponse(res, verification);
  } catch (error) {
    errorResponse(res, error.message);
  }
});

// Get transaction details
router.get('/transaction/:digest', authenticateToken, async (req, res) => {
  try {
    const { digest } = req.params;
    
    const transaction = await blockchainService.getTransaction(digest);
    successResponse(res, transaction);
  } catch (error) {
    errorResponse(res, error.message);
  }
});

// Event listener management
router.get('/event-listener/status', authenticateToken, async (req, res) => {
  try {
    const status = blockchainEventListener.getStatus();
    successResponse(res, status);
  } catch (error) {
    errorResponse(res, error.message);
  }
});

router.post('/event-listener/start', authenticateToken, async (req, res) => {
  try {
    await blockchainEventListener.startListening();
    const status = blockchainEventListener.getStatus();
    successResponse(res, status, 'Event listener started');
  } catch (error) {
    errorResponse(res, error.message);
  }
});

router.post('/event-listener/stop', authenticateToken, async (req, res) => {
  try {
    blockchainEventListener.stopListening();
    const status = blockchainEventListener.getStatus();
    successResponse(res, status, 'Event listener stopped');
  } catch (error) {
    errorResponse(res, error.message);
  }
});

// Blockchain health check
router.get('/health', async (req, res) => {
  try {
    const networkInfo = await blockchainService.getNetworkInfo();
    
    successResponse(res, {
      blockchain: 'healthy',
      network: networkInfo.network,
      packageId: networkInfo.packageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    errorResponse(res, 'Blockchain connection failed', 503);
  }
});

module.exports = router;