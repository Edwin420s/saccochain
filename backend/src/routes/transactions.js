const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Get user transactions
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        createdAt: true
      }
    });

    const total = await prisma.transaction.count({
      where: { userId }
    });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create new transaction
router.post('/', async (req, res) => {
  try {
    const { userId, type, amount, description } = req.body;

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        status: 'PENDING',
        userId,
        description
      }
    });

    // Process transaction based on type
    await processTransaction(transaction);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Process transaction
async function processTransaction(transaction) {
  try {
    // Simulate transaction processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'COMPLETED' }
    });

    // Recalculate credit score if it's a repayment
    if (transaction.type === 'REPAYMENT') {
      await recalculateCreditScore(transaction.userId);
    }
  } catch (error) {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' }
    });
  }
}

// Recalculate credit score
async function recalculateCreditScore(userId) {
  try {
    // Trigger credit score recalculation
    await fetch(`${process.env.API_URL}/api/score/calculate/${userId}`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('Error triggering credit score recalculation:', error);
  }
}

module.exports = router;