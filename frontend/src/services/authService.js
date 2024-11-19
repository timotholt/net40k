import { API_CONFIG, buildApiUrl } from '../config/api';
import axios from 'axios';

// Utility function for making API requests with error handling
async function makeApiRequest(method, url, data, errorMessage) {
  try {
    const response = await axios({ method, url, data });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || errorMessage);
  }
}

export const authService = {
  async login(username, password) {
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), { username, password }, 'Login failed');
  },

  async register(username, password, nickname) {
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), { username, password, nickname }, 'Registration failed');
  },

  async logout() {
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), null, 'Logout failed');
  },

  async validateSession() {
    return makeApiRequest('get', buildApiUrl(API_CONFIG.ENDPOINTS.VALIDATE), null, 'Session validation failed');
  }
};