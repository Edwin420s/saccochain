const { Prisma } = require('@prisma/client');
const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error Stack:', err.stack);
  logger.error('Error Details:', {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Prisma ORM Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        error = {
          message: 'Duplicate field value entered',
          statusCode: 400,
          code: 'DUPLICATE_FIELD'
        };
        break;

      case 'P2014':
        // Invalid ID
        error = {
          message: 'Invalid ID provided',
          statusCode: 400,
          code: 'INVALID_ID'
        };
        break;

      case 'P2003':
        // Foreign key constraint failed
        error = {
          message: 'Related record not found',
          statusCode: 400,
          code: 'RELATION_NOT_FOUND'
        };
        break;

      case 'P2025':
        // Record not found
        error = {
          message: 'Record not found',
          statusCode: 404,
          code: 'RECORD_NOT_FOUND'
        };
        break;

      default:
        error = {
          message: 'Database error occurred',
          statusCode: 500,
          code: 'DATABASE_ERROR'
        };
    }
  }

  // Prisma Client Unknown Request Error
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    error = {
      message: 'Database connection error',
      statusCode: 503,
      code: 'DATABASE_CONNECTION_ERROR'
    };
  }

  // Prisma Validation Error
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = {
      message: 'Invalid data provided',
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    };
  }

  // Mongoose duplicate key error (if using MongoDB in future)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      message: `${field} already exists`,
      statusCode: 400,
      code: 'DUPLICATE_FIELD'
    };
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      statusCode: 401,
      code: 'INVALID_TOKEN'
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      statusCode: 401,
      code: 'TOKEN_EXPIRED'
    };
  }

  // Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      message: messages.join(', '),
      statusCode: 400,
      code: 'VALIDATION_ERROR'
    };
  }

  // Cast Errors (invalid ObjectId)
  if (err.name === 'CastError') {
    error = {
      message: 'Resource not found',
      statusCode: 404,
      code: 'RESOURCE_NOT_FOUND'
    };
  }

  // Rate limit error
  if (err.status === 429) {
    error = {
      message: 'Too many requests, please try again later',
      statusCode: 429,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Don't leak error details in production
  const responseMessage = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? 'Internal server error' 
    : message;

  errorResponse(res, responseMessage, statusCode, {
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

/**
 * Route not found handler
 */
const routeNotFoundHandler = (req, res) => {
  errorResponse(res, `Route not found - ${req.method} ${req.originalUrl}`, 404, {
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  routeNotFoundHandler
};