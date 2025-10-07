import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/api/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/api/auth/register', userData),
  
  getProfile: () => 
    api.get('/api/auth/profile'),
  
  updateProfile: (profileData) => 
    api.patch('/api/auth/profile', profileData),
};

// SACCO API
export const saccoAPI = {
  getAll: () => 
    api.get('/api/sacco'),
  
  getById: (id) => 
    api.get(`/api/sacco/${id}`),
  
  getMembers: (saccoId) => 
    api.get(`/api/sacco/${saccoId}/members`),
  
  register: (saccoData) => 
    api.post('/api/sacco/register', saccoData),
};

// Credit Score API
export const creditScoreAPI = {
  calculate: (userId) => 
    api.post(`/api/score/calculate/${userId}`),
  
  getHistory: (userId) => 
    api.get(`/api/score/history/${userId}`),
  
  storeOnChain: (data) => 
    api.post('/api/sui/store-score', data),
  
  verifyOnChain: (creditScoreId) => 
    api.get(`/api/sui/verify-score/${creditScoreId}`),
};

// Transaction API
export const transactionAPI = {
  getUserTransactions: (userId, params = {}) => 
    api.get(`/api/transactions/${userId}`, { params }),
  
  create: (transactionData) => 
    api.post('/api/transactions', transactionData),
  
  getById: (id) => 
    api.get(`/api/transactions/${id}`),
};

// Admin API
export const adminAPI = {
  getStats: () => 
    api.get('/api/admin/stats'),
  
  getSaccos: () => 
    api.get('/api/admin/saccos'),
  
  getUsers: (params = {}) => 
    api.get('/api/admin/users', { params }),
  
  updateUserRole: (userId, role) => 
    api.patch(`/api/admin/users/${userId}/role`, { role }),
  
  getAnalytics: () => 
    api.get('/api/admin/analytics'),
};

// Sui Blockchain API
export const suiAPI = {
  registerSacco: (saccoData) => 
    api.post('/api/sui/register-sacco', saccoData),
  
  getWalletTransactions: (walletAddress) => 
    api.get(`/api/sui/wallet/${walletAddress}/transactions`),
};

// Health check
export const healthCheck = () => 
  api.get('/health');

export default api;