// frontend/src/utils/auth.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from '../services/api';

// ---------------- Context Setup ----------------
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// ---------------- AuthProvider ----------------
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user & token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user_data');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ---------------- Auth Actions ----------------
  const login = async (credentials) => {
    try {
      const data = await ApiService.authAPI.login(credentials);

      // Support both response formats
      const access = data.access || data.tokens?.access;
      const refresh = data.refresh || data.tokens?.refresh;
      const userData = data.user || null;

      if (access && refresh) {
        setTokens({ access, refresh });
        setUserData(userData);

        setToken(access);
        setUser(userData);
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData) => {
    try {
      return await ApiService.authAPI.register(userData);
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---------------- Utility Functions ----------------

// Store tokens
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
};

// Store user data
export const setUserData = (user) => {
  if (user) localStorage.setItem('user_data', JSON.stringify(user));
};

// Check if user is authenticated
export const isAuthenticated = () => !!localStorage.getItem('access_token');

// Get stored user
export const getUserData = () => {
  const user = localStorage.getItem('user_data');
  return user ? JSON.parse(user) : null;
};

// Extract error messages from API responses
export const getErrorMessage = (error) => {
  if (error.response?.data?.detail) return error.response.data.detail;
  if (error.response?.data?.error) return error.response.data.error;
  return 'Something went wrong. Please try again.';
};

// Dummy account validation helper
export const validateAccountNumber = (acc) => /^\d{10,12}$/.test(acc);

// Formatting helpers
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

export const formatCurrency = (amount) => {
  if (amount == null) return '$0.00';
  return `$${Number(amount).toFixed(2)}`;
};
