const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/verification/member/:userId
 * @desc    Get comprehensive member credit information across all SACCOs
 * @access  Private (SACCO Admin)
 */
router.get('/member/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user details with SACCO and credit scores
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                sacco: true,
                creditScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                },
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate financial metrics
        const totalDeposits = await prisma.transaction.aggregate({
            where: {
                userId,
                type: 'DEPOSIT',
                status: 'COMPLETED'
            },
            _sum: { amount: true }
        });

        const totalWithdrawals = await prisma.transaction.aggregate({
            where: {
                userId,
                type: 'WITHDRAWAL',
                status: 'COMPLETED'
            },
            _sum: { amount: true }
        });

        const activeLoans = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'LOAN',
                status: 'COMPLETED'
            }
        });

        const repayments = await prisma.transaction.findMany({
            where: {
                userId,
                type: 'REPAYMENT',
                status: 'COMPLETED'
            }
        });

        // Calculate totals
        const totalLoans = activeLoans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0);
        const totalRepayments = repayments.reduce((sum, repay) => sum + parseFloat(repay.amount), 0);
        const outstandingBalance = totalLoans - totalRepayments;

        // Get latest credit score
        const latestScore = user.creditScores[0] || null;

        // Calculate repayment rate
        const repaymentRate = totalLoans > 0 ? ((totalRepayments / totalLoans) * 100).toFixed(2) : 100;

        // Determine risk level
        let riskLevel = 'LOW';
        if (outstandingBalance > 50000 || repaymentRate < 70) {
            riskLevel = 'HIGH';
        } else if (outstandingBalance > 20000 || repaymentRate < 85) {
            riskLevel = 'MEDIUM';
        }

        // Search for user activity in other SACCOs (simulated - would query inter-SACCO network)
        const otherSaccoActivity = {
            hasBorrowings: activeLoans.length > 0,
            totalActiveSaccos: 1, // In production, query actual network
            crossSaccoScore: latestScore ? latestScore.score : 0
        };

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                nationalId: user.nationalId,
                walletAddress: user.walletAddress,
                memberSince: user.createdAt
            },
            sacco: user.sacco ? {
                id: user.sacco.id,
                name: user.sacco.name,
                licenseNumber: user.sacco.licenseNumber
            } : null,
            creditProfile: {
                latestScore: latestScore ? latestScore.score : null,
                scoreDate: latestScore ? latestScore.createdAt : null,
                onChainHash: latestScore ? latestScore.onChainHash : null,
                riskLevel
            },
            financialSummary: {
                totalDeposits: totalDeposits._sum.amount || 0,
                totalWithdrawals: totalWithdrawals._sum.amount || 0,
                totalLoans,
                totalRepayments,
                outstandingBalance,
                repaymentRate: parseFloat(repaymentRate)
            },
            loanHistory: {
                activeLoans: activeLoans.length,
                totalLoansIssued: activeLoans.length,
                recentLoans: activeLoans.slice(0, 5).map(loan => ({
                    amount: loan.amount,
                    date: loan.createdAt,
                    status: loan.status
                }))
            },
            interSaccoActivity: otherSaccoActivity,
            recentTransactions: user.transactions.slice(0, 10).map(tx => ({
                type: tx.type,
                amount: tx.amount,
                status: tx.status,
                date: tx.createdAt
            })),
            verificationTimestamp: new Date().toISOString(),
            verified: true,
            verificationSource: 'SACCOChain Network'
        });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to verify member information' });
    }
});

/**
 * @route   GET /api/verification/wallet/:walletAddress
 * @desc    Verify member by wallet address (blockchain lookup)
 * @access  Private
 */
router.get('/wallet/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        const user = await prisma.user.findFirst({
            where: { walletAddress },
            include: {
                sacco: true,
                creditScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                verified: false,
                message: 'No member found with this wallet address'
            });
        }

        const latestScore = user.creditScores[0];

        res.json({
            verified: true,
            user: {
                id: user.id,
                name: user.name,
                sacco: user.sacco?.name,
                creditScore: latestScore ? latestScore.score : null,
                onChainHash: latestScore ? latestScore.onChainHash : null,
                memberSince: user.createdAt
            }
        });
    } catch (error) {
        console.error('Wallet verification error:', error);
        res.status(500).json({ error: 'Failed to verify wallet' });
    }
});

/**
 * @route   GET /api/verification/national-id/:nationalId
 * @desc    Verify member by national ID
 * @access  Private (SACCO Admin)
 */
router.get('/national-id/:nationalId', async (req, res) => {
    try {
        const { nationalId } = req.params;

        const user = await prisma.user.findFirst({
            where: { nationalId },
            include: {
                sacco: true,
                creditScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                transactions: {
                    where: {
                        type: 'LOAN',
                        status: { in: ['PENDING', 'COMPLETED'] }
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                verified: false,
                message: 'No member found with this national ID'
            });
        }

        const activeLoans = user.transactions.filter(tx => tx.type === 'LOAN');
        const latestScore = user.creditScores[0];

        res.json({
            verified: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                sacco: user.sacco?.name,
                saccoId: user.sacco?.id,
                walletAddress: user.walletAddress
            },
            creditInfo: {
                score: latestScore ? latestScore.score : null,
                riskLevel: latestScore ? latestScore.riskLevel : 'UNKNOWN',
                activeLoans: activeLoans.length,
                onChainVerified: latestScore?.onChainHash ? true : false
            }
        });
    } catch (error) {
        console.error('National ID verification error:', error);
        res.status(500).json({ error: 'Failed to verify national ID' });
    }
});

/**
 * @route   POST /api/verification/batch
 * @desc    Batch verify multiple members (for SACCO data migration)
 * @access  Private (SACCO Admin)
 */
router.post('/batch', async (req, res) => {
    try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ error: 'Invalid user IDs array' });
        }

        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds }
            },
            include: {
                creditScores: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                },
                sacco: true
            }
        });

        const results = users.map(user => ({
            userId: user.id,
            name: user.name,
            creditScore: user.creditScores[0]?.score || null,
            sacco: user.sacco?.name,
            verified: true
        }));

        res.json({
            total: results.length,
            verified: results.length,
            results
        });
    } catch (error) {
        console.error('Batch verification error:', error);
        res.status(500).json({ error: 'Failed to perform batch verification' });
    }
});

module.exports = router;
