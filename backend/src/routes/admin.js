const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Get all SACCOs
router.get('/saccos', requireAdmin, async (req, res) => {
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
            users: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(saccos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch SACCOs' });
  }
});

// Get SACCO statistics
router.get('/stats', requireAdmin, async (req, res) => {
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

    res.json({
      totalSaccos,
      totalUsers,
      totalTransactions,
      averageCreditScore: averageCreditScore._avg.creditScore || 0,
      recentRegistrations
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all users with pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

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
              transactions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
router.patch('/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER', 'AUDITOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
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

    res.json({
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get system analytics
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
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
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
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
          name: true,
          users: {
            select: {
              creditScore: true
            }
          }
        }
      })
    ]);

    res.json({
      dailyRegistrations,
      creditScoreDistribution,
      transactionStats,
      saccoPerformance: saccoPerformance.map(sacco => ({
        name: sacco.name,
        averageScore: sacco.users.reduce((sum, user) => sum + (user.creditScore || 0), 0) / sacco.users.length,
        memberCount: sacco.users.length
      }))
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;