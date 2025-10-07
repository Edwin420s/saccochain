const express = require('express');
const authRoutes = require('./auth');
const saccoRoutes = require('./sacco');
const scoreRoutes = require('./score');
const suiRoutes = require('./sui');
const transactionRoutes = require('./transactions');
const adminRoutes = require('./admin');

const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'SACCOChain API',
    version: '1.0.0'
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/sacco', saccoRoutes);
router.use('/score', scoreRoutes);
router.use('/sui', suiRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);

// 404 handler for API routes
router.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

module.exports = router;