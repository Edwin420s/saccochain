const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateTransaction } = require('../middleware/validationMiddleware');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const router = express.Router();
const prisma = new PrismaClient();

// Get user transactions with pagination and filtering
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, type, status, startDate, endDate } = req.query;

    // Verify user access
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    const skip = (page - 1) * parseInt(limit);
    const where = { userId };

    // Add filters
    if (type) where.type = type;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          description: true,
          createdAt: true
        }
      }),
      prisma.transaction.count({ where })
    ]);

    successResponse(res, {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    errorResponse(res, 'Failed to fetch transactions');
  }
});

// Create new transaction
router.post('/', authenticateToken, validateTransaction, async (req, res) => {
  try {
    const { userId, type, amount, description } = req.body;

    // Verify user access
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount: parseFloat(amount),
        status: 'PENDING',
        description,
        userId
      }
    });

    // Process transaction asynchronously
    processTransaction(transaction);

    successResponse(res, transaction, 'Transaction created successfully', 201);
  } catch (error) {
    console.error('Error creating transaction:', error);
    errorResponse(res, 'Failed to create transaction');
  }
});

// Get transaction by ID
router.get('/single/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!transaction) {
      return errorResponse(res, 'Transaction not found', 404);
    }

    // Verify access
    if (req.user.id !== transaction.userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    successResponse(res, transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    errorResponse(res, 'Failed to fetch transaction');
  }
});

// Update transaction status (Admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Admin access required', 403);
    }

    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status', 400);
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: { status }
    });

    successResponse(res, transaction, 'Transaction status updated');
  } catch (error) {
    console.error('Error updating transaction:', error);
    errorResponse(res, 'Failed to update transaction');
  }
});

// Get transaction statistics for user
router.get('/:userId/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user access
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Access denied', 403);
    }

    const stats = await prisma.transaction.groupBy({
      by: ['type', 'status'],
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    const totalStats = await prisma.transaction.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { amount: true }
    });

    successResponse(res, {
      byType: stats,
      total: {
        count: totalStats._count.id,
        amount: totalStats._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching transaction stats:', error);
    errorResponse(res, 'Failed to fetch transaction statistics');
  }
});

// Process transaction (background job)
async function processTransaction(transaction) {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update transaction status based on some logic
    const status = Math.random() > 0.1 ? 'COMPLETED' : 'FAILED'; // 90% success rate

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status }
    });

    console.log(`Transaction ${transaction.id} processed with status: ${status}`);

    // Trigger credit score recalculation for completed repayments
    if (transaction.type === 'REPAYMENT' && status === 'COMPLETED') {
      await triggerCreditScoreRecalculation(transaction.userId);
    }
  } catch (error) {
    console.error('Error processing transaction:', error);
    
    // Mark transaction as failed
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'FAILED' }
    });
  }
}

// Trigger credit score recalculation
async function triggerCreditScoreRecalculation(userId) {
  try {
    // This would call the credit scoring service
    console.log(`Triggering credit score recalculation for user: ${userId}`);
    
    // In a real implementation, you might:
    // 1. Call an internal API endpoint
    // 2. Add to a job queue
    // 3. Trigger a webhook
  } catch (error) {
    console.error('Error triggering credit score recalculation:', error);
  }
}

module.exports = router;