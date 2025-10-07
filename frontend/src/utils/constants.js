// Application constants
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'SACCOChain',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  enableBlockchain: import.meta.env.VITE_ENABLE_BLOCKCHAIN === 'true',
  enableAIScoring: import.meta.env.VITE_ENABLE_AI_SCORING === 'true',
};

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  LOAN: 'LOAN',
  REPAYMENT: 'REPAYMENT',
};

export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  AUDITOR: 'AUDITOR',
};

// Credit score risk levels
export const RISK_LEVELS = {
  LOW: {
    level: 'LOW',
    color: 'green',
    description: 'Low Risk',
    scoreRange: [700, 1000]
  },
  MEDIUM: {
    level: 'MEDIUM',
    color: 'yellow',
    description: 'Medium Risk',
    scoreRange: [500, 699]
  },
  HIGH: {
    level: 'HIGH',
    color: 'red',
    description: 'High Risk',
    scoreRange: [0, 499]
  }
};

// Blockchain networks
export const BLOCKCHAIN_NETWORKS = {
  TESTNET: 'testnet',
  MAINNET: 'mainnet',
  DEVNET: 'devnet'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
  },
  SACCO: {
    LIST: '/api/sacco',
    MEMBERS: '/api/sacco/:id/members',
    REGISTER: '/api/sacco/register',
  },
  TRANSACTIONS: {
    LIST: '/api/transactions/:userId',
    CREATE: '/api/transactions',
    STATS: '/api/transactions/:userId/stats',
  },
  CREDIT_SCORE: {
    CALCULATE: '/api/score/calculate/:userId',
    HISTORY: '/api/score/history/:userId',
  },
  BLOCKCHAIN: {
    NETWORK_INFO: '/api/blockchain/network-info',
    CREDIT_RECORDS: '/api/blockchain/credit-records/:userAddress',
    VERIFY_SCORE: '/api/blockchain/verify-credit-score',
  },
  ADMIN: {
    STATS: '/api/admin/stats',
    USERS: '/api/admin/users',
    SACCO_LIST: '/api/admin/saccos',
    ANALYTICS: '/api/admin/analytics',
  }
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'saccochain_token',
  USER_DATA: 'saccochain_user',
  THEME_PREFERENCE: 'saccochain_theme',
  LANGUAGE: 'saccochain_language',
};

// Form validation rules
export const VALIDATION_RULES = {
  EMAIL: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  PASSWORD: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  },
  NAME: {
    required: 'Name is required',
    minLength: {
      value: 2,
      message: 'Name must be at least 2 characters'
    }
  },
  NATIONAL_ID: {
    required: 'National ID is required',
    pattern: {
      value: /^\d{8,9}$/,
      message: 'National ID must be 8 or 9 digits'
    }
  },
  AMOUNT: {
    required: 'Amount is required',
    min: {
      value: 1,
      message: 'Amount must be greater than 0'
    }
  }
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'dd MMM yyyy',
  DISPLAY_WITH_TIME: 'dd MMM yyyy, HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
};

// Currency configuration
export const CURRENCY_CONFIG = {
  KES: {
    symbol: 'KES',
    decimalPlaces: 2,
    format: (amount) => `KES ${amount?.toLocaleString('en-KE') || '0'}`
  },
  USD: {
    symbol: '$',
    decimalPlaces: 2,
    format: (amount) => `$${amount?.toLocaleString('en-US') || '0'}`
  }
};

// Feature flags
export const FEATURE_FLAGS = {
  BLOCKCHAIN_INTEGRATION: import.meta.env.VITE_ENABLE_BLOCKCHAIN === 'true',
  AI_CREDIT_SCORING: import.meta.env.VITE_ENABLE_AI_SCORING === 'true',
  MULTI_LANGUAGE: import.meta.env.VITE_ENABLE_MULTI_LANGUAGE === 'true',
  DARK_MODE: true,
  OFFLINE_MODE: false,
  PUSH_NOTIFICATIONS: false
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  CREDIT_SCORE_CALCULATION_FAILED: 'Failed to calculate credit score. Please try again.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  TRANSACTION_CREATED: 'Transaction created successfully!',
  CREDIT_SCORE_CALCULATED: 'Credit score calculated successfully!',
  WALLET_CONNECTED: 'Wallet connected successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!'
};