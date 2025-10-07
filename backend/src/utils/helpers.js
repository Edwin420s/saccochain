const crypto = require('crypto');

/**
 * Generate a random string of specified length
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };

  return new Date(date).toLocaleDateString('en-KE', defaultOptions);
};

/**
 * Calculate age from birth date
 */
const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Kenya format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Validate national ID (Kenya format)
 */
const isValidNationalId = (nationalId) => {
  const idRegex = /^\d{8,9}$/;
  return idRegex.test(nationalId);
};

/**
 * Sanitize input for SQL injection prevention
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/'/g, "''")
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

/**
 * Generate pagination metadata
 */
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
};

/**
 * Calculate credit score risk level
 */
const getRiskLevel = (score) => {
  if (score >= 800) return { level: 'LOW', color: 'green', description: 'Excellent' };
  if (score >= 700) return { level: 'LOW', color: 'green', description: 'Good' };
  if (score >= 600) return { level: 'MEDIUM', color: 'yellow', description: 'Fair' };
  if (score >= 500) return { level: 'MEDIUM', color: 'yellow', description: 'Below Average' };
  return { level: 'HIGH', color: 'red', description: 'Poor' };
};

/**
 * Generate transaction reference
 */
const generateTransactionRef = (prefix = 'TXN') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Calculate loan interest
 */
const calculateLoanInterest = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;
  const interest = principal * monthlyRate * months;
  return Math.round(interest * 100) / 100;
};

/**
 * Calculate monthly loan payment
 */
const calculateMonthlyPayment = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return Math.round(payment * 100) / 100;
};

/**
 * Debounce function for limiting API calls
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

module.exports = {
  generateRandomString,
  formatCurrency,
  formatDate,
  calculateAge,
  isValidEmail,
  isValidPhone,
  isValidNationalId,
  sanitizeInput,
  generatePagination,
  getRiskLevel,
  generateTransactionRef,
  calculateLoanInterest,
  calculateMonthlyPayment,
  debounce,
  deepClone
};