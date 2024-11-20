// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Log the environment variable and final API URL
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('Final API URL:', API_URL);

export const API_CONFIG = {
  BASE_URL: API_URL,
  ENDPOINTS: {
    // Authentication
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',

    // Profile Management
    CHANGE_NICKNAME: '/users/change-nickname',
    CHANGE_PASSWORD: '/users/change-password',
    DELETE_ACCOUNT: '/users', // :userId will be appended

    // Game Lobby
    LOBBY: '/lobby',
    JOIN_GAME: '/lobby', // :id/join will be appended
    LEAVE_GAME: '/lobby', // :id/leave will be appended
    DELETE_GAME: '/lobby', // :id will be appended

    // Chat
    CHAT: '/chat',
    DELETE_CHAT: '/chat/game', // :gameId will be appended

    // Admin
    ADMIN_URL: '/users/admin-url',
    CREATE_DB: '/admin/createdb'
  }
};

// Helper function to build API URLs with parameters
export function buildApiUrl(endpoint, params = {}) {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Replace URL parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  console.log('Building API URL:', url);
  return url;
}