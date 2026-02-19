const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/saccochain_test';

  // Create test database if it doesn't exist
  try {
    execSync('npx prisma migrate reset --force', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    });
  } catch (error) {
    console.warn('Failed to reset test database:', error.message);
  }

  // Connect to test database
  await prisma.$connect();
});

// Global test teardown
afterAll(async () => {
  // Clean up test database
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Sacco", "Transaction", "CreditScore" CASCADE;`;
  
  // Disconnect Prisma
  await prisma.$disconnect();
});

// Test utilities
const testUtils = {
  /**
   * Create a test user
   */
  async createTestUser(userData = {}) {
    return await prisma.user.create({
      data: {
        email: userData.email || `test${Date.now()}@example.com`,
        password: userData.password || 'testpassword123',
        name: userData.name || 'Test User',
        nationalId: userData.nationalId || `1234567${Date.now()}`.substr(0, 9),
        role: userData.role || 'MEMBER',
        ...userData
      }
    });
  },

  /**
   * Create a test SACCO
   */
  async createTestSacco(saccoData = {}) {
    return await prisma.sacco.create({
      data: {
        name: saccoData.name || `Test SACCO ${Date.now()}`,
        licenseNo: saccoData.licenseNo || `LIC${Date.now()}`,
        ...saccoData
      }
    });
  },

  /**
   * Create a test transaction
   */
  async createTestTransaction(transactionData) {
    return await prisma.transaction.create({
      data: {
        type: transactionData.type || 'DEPOSIT',
        amount: transactionData.amount || 1000,
        status: transactionData.status || 'COMPLETED',
        description: transactionData.description || 'Test transaction',
        userId: transactionData.userId,
        ...transactionData
      }
    });
  },

  /**
   * Create a test credit score
   */
  async createTestCreditScore(creditScoreData) {
    return await prisma.creditScore.create({
      data: {
        score: creditScoreData.score || 750,
        riskLevel: creditScoreData.riskLevel || 'LOW',
        userId: creditScoreData.userId,
        ...creditScoreData
      }
    });
  },

  /**
   * Clean up test data
   */
  async cleanupTestData() {
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Sacco", "Transaction", "CreditScore" CASCADE;`;
  }
};

module.exports = testUtils;
