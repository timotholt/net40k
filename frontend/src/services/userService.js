import axiosInstance from '../api/axiosConfig';

export const userService = {
  async getUsers(filter = {}, options = {}) {
    const { page = 1, limit = 50 } = options;
    
    try {
      const response = await axiosInstance.get('/users/list', {
        params: {
          ...filter,
          page,
          limit
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch users');
      }

      return {
        users: response.data.users.map(user => transformUserData(user)),
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  },

  async getActiveUsers(options = {}) {
    const { page = 1, limit = 50, filter = {} } = options;
    
    try {
      const response = await axiosInstance.get('/users/active', {
        params: {
          ...filter,
          page,
          limit
        }
      });

      return response.data.users.map(user => transformUserData(user));
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      throw error;
    }
  }
};

// Transform user data to match frontend expectations
function transformUserData(user) {

  // Determine status based on connectionStatus
  user.status = (['online', 'uncertain'].includes(user.connectionStatus)) ? 'Lobby' : 'Offline';

  return {
    userUuid: user.userUuid,
    nickname: user.nickname,
    connectionStatus: user.connectionStatus,
    lastActive: user.lastActive,
    isAdmin: user.isAdmin || false,
    isCurrentUser: user.isCurrentUser || false,
    status: user.status || 'TBD', // Use backend status if available, otherwise TBD
    // Only include these if they exist (private user data)
    ...(user.email && { email: user.email }),
    ...(user.isActive !== undefined && { isActive: user.isActive }),
    ...(user.isVerified !== undefined && { isVerified: user.isVerified }),
    ...(user.preferences && { preferences: user.preferences }),
    ...(user.createdAt && { createdAt: user.createdAt }),
    ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt }),
    ...(user.profilePicture && { profilePicture: user.profilePicture }),
    ...(user.bio && { bio: user.bio })
  };
}

export default userService;
