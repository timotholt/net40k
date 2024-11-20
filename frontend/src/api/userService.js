import { API_CONFIG, buildApiUrl } from '../config/api';
import axios from 'axios';
import logger from '../utils/logger';

// Utility function for making API requests with error handling
async function makeApiRequest(method, url, data = null) {
  try {
    logger.info(`Making API request: ${method} ${url}`, { data });
    const response = await axios({
      method,
      url,
      data,
      withCredentials: true
    });
    logger.info(`API request successful: ${method} ${url}`, { 
      status: response.status, 
      data: response.data 
    });
    return response.data;
  } catch (error) {
    logger.error(`API request failed: ${method} ${url}`, { 
      error: error.message, 
      response: error.response?.data 
    });
    // Simply throw the error to be caught by the thunk
    throw error;
  }
}

export const userService = {
  async login(username, password) {
    logger.info('Attempting login', { username });
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), { username, password });
  },

  async register(username, password, nickname) {
    logger.info('Attempting registration', { username, nickname });
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), { username, password, nickname });
  },

  async logout() {
    logger.info('Attempting logout');
    return makeApiRequest('post', buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), null);
  },

  async validateSession() {
    logger.info('Validating session');
    return makeApiRequest('get', buildApiUrl(API_CONFIG.ENDPOINTS.VALIDATE), null);
  }
};