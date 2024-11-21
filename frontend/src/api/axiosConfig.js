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
    // Commented out detailed error logging to reduce scary stack traces
    // console.log('Axios Interceptor Raw Error:', {
    //   type: typeof error,
    //   keys: Object.keys(error),
    //   response: error.response,
    //   request: error.request,
    //   message: error.message,
    //   name: error.name,
    //   stack: error.stack,
    //   toString: error.toString()
    // });

    console.log('API Error Response:', error.response?.data);
    
    // Check for invalid session conditions
    if (error.response?.status === 401 || 
        error.response?.data?.message?.toLowerCase().includes('invalid session')) {
      // Set global flag to invalid
      isTokenValid = false;
      
      // Optional: Remove invalid session token
      localStorage.removeItem(`sessionToken_${window.name}`);
      
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
export { isTokenValid }; // Export for potential use in other components
