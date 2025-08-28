// frontend/src/services/api.js

import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          original.headers.Authorization = `Bearer ${access}`;
          return axios(original);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/* ===========================
   Auth API
=========================== */
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
};

/* ===========================
   Account API
=========================== */
export const accountAPI = {
  getBalance: async () => {
    const response = await api.get('/auth/balance/');
    return response.data;
  },

  transfer: async (transferData) => {
    // transferData = { recipient_account_number, amount, description }
    const response = await api.post('/auth/transfer/', transferData);
    return response.data;
  },
};

/* ===========================
   Transactions API
=========================== */

export const transactionAPI = {
  getTransactions: async (params = {}) => {
    const { page = 1, ...otherParams } = params;
    const response = await api.get('/transactions/', {
      params: { page, ...otherParams },
    });
    return response.data;
  },

  getTransactionStats: async () => {
    const response = await api.get('/transactions/stats/');
    return response.data;
  },

  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions/', transactionData);
    return response.data;
  },

  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}/`, transactionData);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}/`);
    return response.data;
  },
};


export const ApiService = { authAPI, accountAPI, transactionAPI };
export default api;
