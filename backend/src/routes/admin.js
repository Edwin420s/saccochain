const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const router = express.Router();
const prisma = new PrismaClient();

// Get all SACCOs
router.get('/saccos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const saccos = await prisma.sacco.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            creditScore: true
          }
        },
        _count: {
          select: {
            users: true,
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    successResponse(res, saccos);
  } catch (error) {
    console.error('Error fetching SACCOs:', error);
    errorResponse(res, 'Failed to fetch SACCOs');
  }
});

// Get system statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [
      totalSaccos,
      totalUsers,
      totalTransactions,
      averageCreditScore,
      recentRegistrations
    ] = await Promise.all([
      prisma.sacco.count(),
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.user.aggregate({
        _avg: {
          creditScore: true
        }
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          sacco: {
            select: {
              name: true
            }
          }
        }
      })
    ]);

    successResponse(res, {
      totalSaccos,
      totalUsers,
      totalTransactions,
      averageCreditScore: averageCreditScore._avg.creditScore || 0,
      recentRegistrations
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    errorResponse(res, 'Failed to fetch statistics');
  }
});

// Get all users with pagination and search
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', saccoId } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      OR: search ? [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ] : undefined,
      saccoId: saccoId || undefined
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          email: true,
          nationalId: true,
          walletAddress: true,
          creditScore: true,
          role: true,
          sacco: {
            select: {
              name: true
            }
          },
          createdAt: true,
          _count: {
            select: {
              transactions: true,
              creditScores: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    errorResponse(res, 'Failed to fetch users');
  }
});

// Update user role
router.patch('/users/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER', 'AUDITOR'].includes(role)) {
      return errorResponse(res, 'Invalid role', 400);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    successResponse(res, user, 'User role updated successfully');
  } catch (error) {
    console.error('Error updating user role:', error);
    errorResponse(res, 'Failed to update user role');
  }
});

// Get system analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      dailyRegistrations,
      creditScoreDistribution,
      transactionStats,
      saccoPerformance
    ] = await Promise.all([
      // Daily registrations for the last 30 days
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        _count: {
          id: true
        }
      }),

      // Credit score distribution
      prisma.user.groupBy({
        by: ['creditScore'],
        _count: {
          id: true
        },
        orderBy: {
          creditScore: 'asc'
        }
      }),

      // Transaction statistics
      prisma.transaction.groupBy({
        by: ['type', 'status'],
        _count: {
          id: true
        },
        _sum: {
          amount: true
        }
      }),

      // SACCO performance
      prisma.sacco.findMany({
        select: {
          id: true,
          name: true,
          users: {
            select: {
              creditScore: true
            }
          },
          _count: {
            select: {
              users: true,
              transactions: true
            }
          }
        }
      })
    ]);

    // Process analytics data
    const processedAnalytics = {
      dailyRegistrations: dailyRegistrations.map(day => ({
        date: day.createdAt.toISOString().split('T')[0],
        count: day._count.id
      })),
      creditScoreDistribution: creditScoreDistribution
        .filter(score => score.creditScore !== null)
        .map(score => ({
          score: score.creditScore,
          count: score._count.id
        })),
      transactionStats: transactionStats.reduce((acc, stat) => {
        if (!acc[stat.type]) acc[stat.type] = {};
        acc[stat.type][stat.status] = {
          count: stat._count.id,
          amount: stat._sum.amount || 0
        };
        return acc;
      }, {}),
      saccoPerformance: saccoPerformance.map(sacco => {
        const scores = sacco.users.map(user => user.creditScore).filter(score => score !== null);
        const averageScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : 0;

        return {
          id: sacco.id,
          name: sacco.name,
          averageScore: Math.round(averageScore),
          memberCount: sacco._count.users,
          transactionCount: sacco._count.transactions
        };
      })
    };

    successResponse(res, processedAnalytics);
  } catch (error) {
    console.error('Analytics error:', error);
    errorResponse(res, 'Failed to fetch analytics');
  }
});

// Get user details for admin
router.get('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sacco: true,
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        creditScores: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            transactions: true,
            creditScores: true
          }
        }
      }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    errorResponse(res, 'Failed to fetch user details');
  }
});

module.exports = router;