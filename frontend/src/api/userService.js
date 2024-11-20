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
  },

  async findUserById(userId) {
    logger.info('Finding user by ID', { userId });
    return makeApiRequest('get', buildApiUrl(`${API_CONFIG.ENDPOINTS.USERS}/${userId}`));
  },

  /**
   * Performs a text-based search across user fields (username, nickname, etc.)
   * Useful for finding users by partial name or keyword
   * Typically used in search bars or discovery interfaces
   * Provides a more flexible, fuzzy-matching approach to finding users
   * 
   * @param {string} query - Text to search across user fields
   * @param {Object} options - Pagination and search options
   * @returns {Promise} List of users matching the search query
   */
  async searchUsers(query, options = {}) {
    const { page = 1, limit = 50 } = options;
    logger.info('Searching users', { query, page, limit });
    return makeApiRequest('get', buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
      params: {
        search: query,
        page,
        limit
      }
    });
  },

  /**
   * Retrieves users with precise, structured filtering
   * Used for more specific, predefined user list requirements
   * Supports exact matching on specific user attributes
   * Ideal for admin panels, user management interfaces
   * 
   * @param {Object} filter - Exact match filters for user attributes
   * @param {Object} options - Pagination settings
   * @returns {Promise} List of users matching exact filter criteria
   */
  async getUsers(filter = {}, options = {}) {
    const { page = 1, limit = 100 } = options;
    logger.info('Fetching users', { filter, page, limit });
    return makeApiRequest('get', buildApiUrl(API_CONFIG.ENDPOINTS.USERS), {
      params: {
        ...filter,
        page,
        limit
      }
    });
  },

  async getActiveUsers(options = {}) {
    const { page = 1, limit = 100, filter = {} } = options;
    logger.info('Fetching active users', { filter, page, limit });
    return makeApiRequest('get', buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVE_USERS), {
      params: {
        ...filter,
        page,
        limit
      }
    });
  }
};