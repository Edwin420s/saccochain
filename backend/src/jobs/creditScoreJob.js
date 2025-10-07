const { CronJob } = require('cron');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class CreditScoreJob {
  constructor() {
    this.job = null;
    this.isRunning = false;
  }

  /**
   * Start the credit score calculation job
   */
  start() {
    // Run every day at 2 AM
    this.job = new CronJob('0 2 * * *', async () => {
      await this.calculateCreditScores();
    });

    this.job.start();
    logger.info('Credit score calculation job started');
  }

  /**
   * Stop the job
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Credit score calculation job stopped');
    }
  }

  /**
   * Calculate credit scores for all active users
   */
  async calculateCreditScores() {
    if (this.isRunning) {
      logger.warn('Credit score calculation already in progress');
      return;
    }

    this.isRunning = true;
    logger.info('Starting credit score calculation job');

    try {
      const activeUsers = await prisma.user.findMany({
        where: {
          role: 'MEMBER',
          saccoId: { not: null }
        },
        include: {
          transactions: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
              }
            }
          },
          sacco: true
        }
      });

      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const user of activeUsers) {
        try {
          await this.calculateUserCreditScore(user);
          successful++;
        } catch (error) {
          logger.error(`Failed to calculate credit score for user ${user.id}:`, error);
          failed++;
        }
        processed++;

        // Add delay to avoid overwhelming the AI service
        if (processed % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info(`Credit score calculation completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      logger.error('Credit score calculation job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Calculate credit score for a single user
   */
  async calculateUserCreditScore(user) {
    const userData = await this.prepareUserData(user);

    try {
      // Call AI service to calculate credit score
      const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/api/score`,
        userData,
        { timeout: 30000 }
      );

      const { credit_score, risk_level } = aiResponse.data;

      // Store credit score in database
      const creditScore = await prisma.creditScore.create({
        data: {
          score: credit_score,
          riskLevel: risk_level,
          userId: user.id
        }
      });

      // Store on blockchain if user has wallet
      if (user.walletAddress) {
        try {
          await blockchainService.storeCreditScore(user, credit_score, risk_level);
          
          // Update credit score with blockchain hash
          await prisma.creditScore.update({
            where: { id: creditScore.id },
            data: { 
              onChainHash: 'stored_on_chain',
              updatedAt: new Date()
            }
          });

          logger.info(`Credit score stored on blockchain for user ${user.id}`);
        } catch (blockchainError) {
          logger.warn(`Failed to store credit score on blockchain for user ${user.id}:`, blockchainError);
        }
      }

      // Update user's current credit score
      await prisma.user.update({
        where: { id: user.id },
        data: { creditScore: credit_score }
      });

      logger.info(`Credit score calculated for user ${user.id}: ${credit_score} (${risk_level})`);
    } catch (error) {
      logger.error(`Failed to calculate credit score for user ${user.id}:`, error);
      throw error;
    }
  }

  /**
   * Prepare user data for credit score calculation
   */
  async prepareUserData(user) {
    const transactions = user.transactions || [];

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

  /**
   * Manually trigger credit score calculation for a user
   */
  async calculateScoreForUser(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          transactions: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
              }
            }
          },
          sacco: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      await this.calculateUserCreditScore(user);
      return { success: true, message: 'Credit score calculated successfully' };
    } catch (error) {
      logger.error(`Manual credit score calculation failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isJobActive: this.job ? this.job.running : false,
      lastExecution: this.job ? this.job.lastDate() : null,
      nextExecution: this.job ? this.job.nextDate() : null
    };
  }
}

// Create singleton instance
const creditScoreJob = new CreditScoreJob();

module.exports = creditScoreJob;