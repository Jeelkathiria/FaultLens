import axios from 'axios';

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('faultlens_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // If wrapped in FaultLens standardized response format { success: true, data: ... }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Handle 401 Unauthorized
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('faultlens_token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const errorData = error.response?.data?.error;
    const errorMsg = errorData?.message || error.message || 'Request failed';
    const customError = new Error(errorMsg);
    customError.status = status;
    customError.code = errorData?.code;
    customError.details = errorData?.details;
    if (!error.response) {
      customError.isOffline = true;
    }
    return Promise.reject(customError);
  }
);

export const getToken = () => localStorage.getItem('faultlens_token');

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('faultlens_token', token);
  } else {
    localStorage.removeItem('faultlens_token');
  }
};

api.getToken = getToken;
api.setToken = setToken;

export default api;
