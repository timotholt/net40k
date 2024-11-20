import { API_CONFIG, buildApiUrl } from '../config/api';
import axios from 'axios';

// Utility function for making API requests with error handling
async function makeApiRequest(method, url, data = null) {
  try {
    const response = await axios({
      method,
      url,
      data,
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    // Simply throw the error to be caught by the thunk
    throw error;
  }
}

export const authService = {
  async login(username, password) {
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), { username, password });
  },

  async register(username, password, nickname) {
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), { username, password, nickname });
  },

  async logout() {
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), null);
  },

  async validateSession() {
    return makeApiRequest('get', buildApiUrl(API_CONFIG.ENDPOINTS.VALIDATE), null);
  }
};