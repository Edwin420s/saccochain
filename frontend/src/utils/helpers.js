import { RISK_LEVELS, CURRENCY_CONFIG, DATE_FORMATS } from './constants';

/**
 * Format currency amount
 */
export const formatCurrency = (amount, currency = 'KES') => {
  const config = CURRENCY_CONFIG[currency];
  return config?.format(amount) || `${currency} ${amount}`;
};

/**
 * Format date for display
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  const format = options.format || DATE_FORMATS.DISPLAY;
  
  if (format === DATE_FORMATS.DISPLAY) {
    return dateObj.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
  
  if (format === DATE_FORMATS.DISPLAY_WITH_TIME) {
    return dateObj.toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toISOString();
};

/**
 * Get risk level for credit score
 */
export const getRiskLevel = (score) => {
  if (score >= RISK_LEVELS.LOW.scoreRange[0]) return RISK_LEVELS.LOW;
  if (score >= RISK_LEVELS.MEDIUM.scoreRange[0]) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.HIGH;
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Kenya format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^(\+?254|0)?[17]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Truncate wallet address for display
 */
export const truncateAddress = (address, startLength = 6, endLength = 4) => {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

/**
 * Generate random color for avatars
 */
export const generateRandomColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

/**
 * Get user initials for avatar
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Debounce function for search inputs
 */
export const debounce = (func, wait) => {
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
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * Get file size in readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Generate unique ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}${timestamp}${random}`;
};

/**
 * Parse error message from API response
 */
export const parseErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
};

/**
 * Check if user has required role
 */
export const hasRole = (user, requiredRole) => {
  if (!user || !user.role) return false;
  return user.role === requiredRole;
};

/**
 * Calculate loan payment
 */
export const calculateLoanPayment = (principal, annualRate, months) => {
  const monthlyRate = annualRate / 100 / 12;
  const payment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  return Math.round(payment * 100) / 100;
};

/**
 * Format number with commas
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-KE').format(number);
};