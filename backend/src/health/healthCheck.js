const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const blockchainService = require('../services/blockchainService');

const prisma = new PrismaClient();

class HealthCheckSystem {
  constructor() {
    this.checks = [
      { name: 'database', check: this.checkDatabase.bind(this) },
      { name: 'blockchain', check: this.checkBlockchain.bind(this) },
      { name: 'ai_service', check: this.checkAIService.bind(this) },
      { name: 'redis', check: this.checkRedis.bind(this) }
    ];
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const results = {};
    let overallStatus = 'healthy';

    for (const check of this.checks) {
      try {
        const result = await check.check();
        results[check.name] = {
          status: 'healthy',
          ...result
        };
      } catch (error) {
        results[check.name] = {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        };
        overallStatus = 'degraded';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'saccochain-api',
      version: process.env.npm_package_version || '1.0.0',
      checks: results
    };
  }

  /**
   * Check database connectivity
   */
  async checkDatabase() {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Check database latency
      const latency = Date.now() - startTime;

      // Get some basic stats
      const [userCount, transactionCount, saccoCount] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.sacco.count()
      ]);

      return {
        latency: `${latency}ms`,
        stats: {
          users: userCount,
          transactions: transactionCount,
          saccos: saccoCount
        }
      };
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  /**
   * Check blockchain connectivity
   */
  async checkBlockchain() {
    const startTime = Date.now();
    
    try {
      const networkInfo = await blockchainService.getNetworkInfo();
      const latency = Date.now() - startTime;

      return {
        latency: `${latency}ms`,
        network: networkInfo.network,
        chainIdentifier: networkInfo.chainIdentifier,
        gasPrice: networkInfo.referenceGasPrice
      };
    } catch (error) {
      throw new Error(`Blockchain connection failed: ${error.message}`);
    }
  }

  /**
   * Check AI service connectivity
   */
  async checkAIService() {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${process.env.AI_SERVICE_URL}/api/health`, {
        timeout: 5000
      });

      const latency = Date.now() - startTime;

      return {
        latency: `${latency}ms`,
        status: response.data.status,
        modelLoaded: response.data.model_loaded || false
      };
    } catch (error) {
      throw new Error(`AI service connection failed: ${error.message}`);
    }
  }

  /**
   * Check Redis connectivity
   */
  async checkRedis() {
    // Redis check would be implemented when Redis is added
    // For now, return mock response
    return {
      status: 'not_implemented',
      message: 'Redis check not implemented'
    };
  }

  /**
   * Get detailed health information
   */
  async getDetailedHealth() {
    const health = await this.performHealthCheck();

    // Add system information
    health.system = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    };

    // Add performance metrics
    health.performance = {
      responseTime: 'N/A', // Would be calculated from request tracking
      throughput: 'N/A',   // Would be calculated from request tracking
      errorRate: 'N/A'     // Would be calculated from error tracking
    };

    return health;
  }

  /**
   * Check if system is ready to accept requests
   */
  async isReady() {
    try {
      const health = await this.performHealthCheck();
      
      // Consider system ready if database and blockchain are healthy
      const criticalServices = ['database', 'blockchain'];
      const criticalStatus = criticalServices.every(
        service => health.checks[service]?.status === 'healthy'
      );

      return criticalStatus;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if system is alive (basic connectivity)
   */
  async isAlive() {
    try {
      // Just check database connectivity as minimal alive check
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const healthCheckSystem = new HealthCheckSystem();

module.exports = healthCheckSystem;