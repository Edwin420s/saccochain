const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const router = express.Router();
const prisma = new PrismaClient();

// Calculate credit score for user
router.post('/calculate/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's financial data
    const userData = await getUserFinancialData(userId);
    
    // Call AI service to calculate score
    const aiResponse = await axios.post(
      `${process.env.AI_SERVICE_URL}/api/score`,
      userData
    );

    const { credit_score, risk_level } = aiResponse.data;

    // Store credit score
    const creditScore = await prisma.creditScore.create({
      data: {
        score: credit_score,
        riskLevel: risk_level,
        userId: userId
      }
    });

    // Update user's current credit score
    await prisma.user.update({
      where: { id: userId },
      data: { creditScore: credit_score }
    });

    res.json({
      score: credit_score,
      riskLevel: risk_level,
      calculatedAt: creditScore.createdAt
    });
  } catch (error) {
    console.error('Credit scoring error:', error);
    res.status(500).json({ error: 'Failed to calculate credit score' });
  }
});

// Get user's credit history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const creditHistory = await prisma.creditScore.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        score: true,
        riskLevel: true,
        createdAt: true,
        onChainHash: true
      }
    });

    res.json(creditHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch credit history' });
  }
});

// Helper function to get user financial data
async function getUserFinancialData(userId) {
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 100
      }
    }
  });

  // Calculate financial metrics
  const totalDeposits = transactions
    .filter(t => t.type === 'DEPOSIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLoans = transactions
    .filter(t => t.type === 'LOAN' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const repayments = transactions
    .filter(t => t.type === 'REPAYMENT' && t.status === 'COMPLETED')
    .length;

  const defaults = transactions
    .filter(t => t.status === 'FAILED')
    .length;

  const accountAge = Math.floor(
    (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 30)
  );

  return {
    repayment_history: repayments,
    savings_balance: totalDeposits - totalLoans,
    loan_balance: totalLoans,
    transaction_count: transactions.length,
    account_age_months: accountAge,
    default_count: defaults
  };
}

module.exports = router;