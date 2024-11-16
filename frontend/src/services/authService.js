import { API_CONFIG, buildApiUrl } from '../config/api';

export const authService = {
  async login(username, password) {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  },

  async register(username, password, nickname) {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password, nickname })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  },

  async logout() {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.LOGOUT), {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return true;
    } catch (error) {
      throw new Error(error.message || 'Logout failed');
    }
  },

  async validateSession() {
    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.VALIDATE));

      if (!response.ok) {
        throw new Error('Session validation failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error.message || 'Session validation failed');
    }
  }
};