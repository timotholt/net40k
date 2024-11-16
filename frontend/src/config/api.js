// API configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://sba319-d6cn.onrender.com',
  ENDPOINTS: {
    // Authentication
    LOGIN: '/user/login',
    REGISTER: '/user/register',
    LOGOUT: '/user/logout',

    // Profile Management
    CHANGE_NICKNAME: '/user/change-nickname',
    CHANGE_PASSWORD: '/user/change-password',
    DELETE_ACCOUNT: '/user', // :userId will be appended

    // Game Lobby
    LOBBY: '/lobby',
    JOIN_GAME: '/lobby', // :id/join will be appended
    LEAVE_GAME: '/lobby', // :id/leave will be appended
    DELETE_GAME: '/lobby', // :id will be appended

    // Chat
    CHAT: '/chat',
    DELETE_CHAT: '/chat/game', // :gameId will be appended

    // Admin
    ADMIN_URL: '/user/admin-url',
    CREATE_DB: '/admin/createdb'
  }
};

export const buildApiUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // Replace URL parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });

  console.log('Building API URL:', url);
  return url;
};