const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const config = require('../config');

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false // Disabled for API
});

/**
 * CORS configuration
 */
const corsMiddleware = cors(config.cors);

/**
 * Rate limiting for different endpoints
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: config.rateLimit.message,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter rate limiting for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

/**
 * Stricter rate limiting for blockchain transactions
 */
const blockchainLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 transactions per minute
  message: 'Too many blockchain transactions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Data sanitization against NoSQL injection
 */
const noSqlSanitization = mongoSanitize();

/**
 * Data sanitization against XSS attacks
 */
const xssSanitization = xss();

/**
 * Protect against parameter pollution
 */
const parameterPollutionProtection = hpp();

/**
 * Request logging for security monitoring
 */
const securityLogger = (req, res, next) => {
  const securityEvents = [];

  // Check for suspicious user agents
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    'sqlmap', 'nikto', 'metasploit', 'nmap', 'acunetix',
    'appscan', 'nessus', 'w3af', 'burpsuite'
  ];

  if (suspiciousPatterns.some(pattern => 
    userAgent.toLowerCase().includes(pattern.toLowerCase())
  )) {
    securityEvents.push('SUSPICIOUS_USER_AGENT');
  }

  // Check for unusual request patterns
  if (req.body && Object.keys(req.body).length > 50) {
    securityEvents.push('LARGE_REQUEST_BODY');
  }

  if (req.query && Object.keys(req.query).length > 20) {
    securityEvents.push('TOO_MANY_QUERY_PARAMS');
  }

  // Log security events
  if (securityEvents.length > 0) {
    console.warn('Security events detected:', {
      events: securityEvents,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      userAgent: userAgent
    });
  }

  next();
};

/**
 * IP address filtering (optional)
 */
const ipWhitelist = (req, res, next) => {
  const whitelist = process.env.IP_WHITELIST?.split(',') || [];
  const clientIp = req.ip || req.connection.remoteAddress;

  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied from this IP address',
      code: 'IP_NOT_ALLOWED'
    });
  }

  next();
};

/**
 * API key authentication for internal services
 */
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  const validApiKey = process.env.INTERNAL_API_KEY;

  if (!validApiKey) {
    return next(); // Skip if no API key configured
  }

  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

/**
 * Validate request content type
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Unsupported media type. Only JSON is accepted.',
        code: 'UNSUPPORTED_MEDIA_TYPE'
      });
    }
  }

  next();
};

/**
 * Request size limiting
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = config.upload.maxFileSize;

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      message: `Request body too large. Maximum size is ${maxSize / 1024 / 1024}MB.`,
      code: 'REQUEST_TOO_LARGE'
    });
  }

  next();
};

module.exports = {
  securityHeaders,
  corsMiddleware,
  generalLimiter,
  authLimiter,
  blockchainLimiter,
  noSqlSanitization,
  xssSanitization,
  parameterPollutionProtection,
  securityLogger,
  ipWhitelist,
  apiKeyAuth,
  validateContentType,
  requestSizeLimit
};