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
    
    // Get sessionToken from tab-specific storage
    const sessionToken = localStorage.getItem(`sessionToken_${window.name}`);
    console.log('Tab ID:', window.name);
    console.log('Looking for session token with key:', `sessionToken_${window.name}`);
    console.log('Found session token:', sessionToken);
    
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
    console.log('Axios Interceptor Raw Error:', {
      type: typeof error,
      keys: Object.keys(error),
      response: error.response,
      request: error.request,
      message: error.message,
      name: error.name,
      stack: error.stack,
      toString: error.toString()
    });

    if (error.response) {
      console.log('Server Response Error Details:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers
      });
      
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      
      // Check for specific error types from backend
      const errorMessage = 
        error.response.data.message || 
        error.response.data.error || 
        'An unexpected error occurred';
      
      const errorType = 
        error.response.data.name || 
        error.response.status;

      return Promise.reject({
        message: errorMessage,
        type: errorType,
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
      return Promise.reject({
        message: "Can't connect to game server",
        type: 'NetworkError',
        status: null
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Setup Error:', error.message);
      return Promise.reject({
        message: 'Error setting up the request',
        type: 'SetupError',
        status: null
      });
    }
  }
);

export default axiosInstance;
