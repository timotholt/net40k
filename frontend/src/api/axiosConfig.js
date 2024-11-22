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

// Global flag to track token validity
let isTokenValid = true;

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Immediately reject requests if token is invalid
    if (!isTokenValid) {
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    
    // Log the full request URL
    console.log('Making request to:', config.baseURL + config.url);
    
    // Get sessionToken from tab-specific local storage
    const sessionToken = localStorage.getItem(`sessionToken_${window.name}`);
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
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
    // Log the actual error response
    console.log('API Error Response:', error.response?.data);
    
    // For 4xx and 5xx errors, return the server's error message
    if (error.response) {
      return Promise.reject(
        error.response.data.message || 
        error.response.data.error || 
        'An error occurred'
      );
    }
    
    // Only for true network errors
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      return Promise.reject("Can't connect to game server");
    }
    
    // Fallback for any other unexpected errors
    return Promise.reject('An unexpected error occurred');
  }
);

export default axiosInstance;
export { isTokenValid }; // Export for potential use in other components
