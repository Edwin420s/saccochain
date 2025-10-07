const express = require('express');
const suiService = require('../services/suiService');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const router = express.Router();
const prisma = new PrismaClient();

// Store credit score on blockchain
router.post('/store-score', async (req, res) => {
  try {
    const { userId, creditScoreId } = req.body;

    // Get credit score data
    const creditScore = await prisma.creditScore.findUnique({
      where: { id: creditScoreId },
      include: { user: true }
    });

    if (!creditScore) {
      return res.status(404).json({ error: 'Credit score not found' });
    }

    // Create hash of credit score data
    const scoreData = {
      score: creditScore.score,
      riskLevel: creditScore.riskLevel,
      userId: creditScore.userId,
      calculatedAt: creditScore.createdAt.toISOString()
    };

    const scoreHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(scoreData))
      .digest('hex');

    // Store on blockchain
    const result = await suiService.storeCreditScoreHash(
      creditScore.user.walletAddress,
      scoreHash,
      creditScore.user.saccoId || 'default'
    );

    // Update credit score with blockchain hash
    await prisma.creditScore.update({
      where: { id: creditScoreId },
      data: { onChainHash: scoreHash }
    });

    res.json({
      success: true,
      transactionDigest: result.digest,
      scoreHash,
      message: 'Credit score stored on blockchain successfully'
    });
  } catch (error) {
    console.error('Error storing score on blockchain:', error);
    res.status(500).json({ error: 'Failed to store credit score on blockchain' });
  }
});

// Verify credit score on blockchain
router.get('/verify-score/:creditScoreId', async (req, res) => {
  try {
    const { creditScoreId } = req.params;

    // Get credit score data
    const creditScore = await prisma.creditScore.findUnique({
      where: { id: creditScoreId },
      include: { user: true }
    });

    if (!creditScore || !creditScore.onChainHash) {
      return res.status(404).json({ error: 'Credit score or blockchain hash not found' });
    }

    // Verify on blockchain
    const verification = await suiService.verifyCreditScoreHash(
      creditScore.user.walletAddress,
      creditScore.onChainHash
    );

    res.json({
      verified: verification.verified,
      onChainData: verification,
      localHash: creditScore.onChainHash,
      message: verification.verified 
        ? 'Credit score verified on blockchain' 
        : 'Credit score verification failed'
    });
  } catch (error) {
    console.error('Error verifying score on blockchain:', error);
    res.status(500).json({ error: 'Failed to verify credit score on blockchain' });
  }
});

// Register SACCO on blockchain
router.post('/register-sacco', async (req, res) => {
  try {
    const { saccoId, saccoName } = req.body;

    const result = await suiService.registerSacco(saccoId, saccoName);

    res.json({
      success: true,
      transactionDigest: result.digest,
      message: 'SACCO registered on blockchain successfully'
    });
  } catch (error) {
    console.error('Error registering SACCO on blockchain:', error);
    res.status(500).json({ error: 'Failed to register SACCO on blockchain' });
  }
});

// Get wallet transactions
router.get('/wallet/:walletAddress/transactions', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // This would typically query the Sui blockchain for transaction history
    // For now, return mock data or implement actual blockchain query
    const transactions = await getWalletTransactions(walletAddress);

    res.json({
      walletAddress,
      transactions,
      total: transactions.length
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
});

// Helper function to get wallet transactions (mock implementation)
async function getWalletTransactions(walletAddress) {
  // This is a mock implementation
  // In production, you would query the Sui blockchain
  return [
    {
      digest: '0xabc123...',
      timestamp: new Date().toISOString(),
      type: 'CreditScoreStore',
      status: 'success'
    }
  ];
}

module.exports = router;