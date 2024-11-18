import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Log the base URL to verify it's being set correctly
console.log('API Base URL:', API_CONFIG.BASE_URL);

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Log the full request URL
    console.log('Making request to:', config.baseURL + config.url);
    
    // Get token from localStorage if it exists
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

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      return Promise.reject(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
      return Promise.reject('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', error.message);
      return Promise.reject('Error setting up the request');
    }
  }
);

export default axiosInstance;
