const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'colorless',
});

// Database connection health check
const checkDatabaseHealth = async () => {
  try {
    await prisma.$executeRaw`SELECT 1`;
    console.log('✅ Database connection is healthy');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down database connection...');
  await prisma.$disconnect();
  console.log('Database connection closed');
};

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
  prisma,
  checkDatabaseHealth,
  shutdown
};