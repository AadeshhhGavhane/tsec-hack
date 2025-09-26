import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
};

// Protected API functions
export const protectedAPI = {
  getDashboard: async () => {
    const response = await api.get('/protected/dashboard');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/protected/profile');
    return response.data;
  },

  testProtected: async () => {
    const response = await api.get('/protected/test');
    return response.data;
  },
};

// Transaction API functions
export const transactionAPI = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  getTransaction: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (transactionData) => {
    const response = await api.post('/transactions', transactionData);
    return response.data;
  },

  updateTransaction: async (id, transactionData) => {
    const response = await api.put(`/transactions/${id}`, transactionData);
    return response.data;
  },

  deleteTransaction: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },

  analyzeImage: async (file) => {
    const form = new FormData();
    form.append('image', file);
    const response = await api.post('/transactions/analyze-image', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  analyzeAudio: async (fileOrBlob) => {
    const form = new FormData();
    form.append('audio', fileOrBlob, 'recording.webm');
    const response = await api.post('/transactions/analyze-audio', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// Category API functions
export const categoryAPI = {
  getCategories: async (type = null, search = null) => {
    const params = {};
    if (type) params.type = type;
    if (search) params.search = search;
    const response = await api.get('/categories', { params });
    return response.data;
  },

  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },

  restoreDefaults: async () => {
    const response = await api.post('/categories/restore-defaults');
    return response.data;
  },
};

// Learn API functions
export const learnAPI = {
  generateQuiz: async ({ topic, difficulty, length = 5 }) => {
    const response = await api.post('/learn/quizzes/generate', { topic, difficulty, length });
    return response.data;
  },
  submitQuiz: async (quizId, { answers, timeTakenSec = 0 }) => {
    const response = await api.post(`/learn/quizzes/${quizId}/submit`, { answers, timeTakenSec });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/learn/history');
    return response.data;
  },
  getAttempt: async (attemptId) => {
    const response = await api.get(`/learn/attempts/${attemptId}`);
    return response.data;
  },
  recommend: async () => {
    const response = await api.get('/learn/recommend');
    return response.data;
  }
};

// Budget API functions
export const budgetAPI = {
  generate: async (payload) => {
    const response = await api.post('/budget/generate', payload);
    return response.data;
  },
  save: async (payload) => {
    const response = await api.post('/budget/save', payload);
    return response.data;
  },
  current: async (month) => {
    const response = await api.get('/budget/current', { params: { month } });
    return response.data;
  },
  history: async () => {
    const response = await api.get('/budget/history');
    return response.data;
  },
  recommend: async (payload) => {
    const response = await api.post('/budget/recommend', payload);
    return response.data;
  }
};

// Insights & Alerts API functions
export const insightsAPI = {
  getSpending: async (months = 6) => {
    const response = await api.get('/insights/spending', { params: { months } });
    return response.data;
  }
};

export const alertsAPI = {
  getAlerts: async (month) => {
    const response = await api.get('/alerts', { params: { month } });
    return response.data;
  }
};

export default api;
