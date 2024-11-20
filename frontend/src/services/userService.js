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

      return response.data.users;
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

      return response.data.users;
    } catch (error) {
      console.error('Failed to fetch active users:', error);
      throw error;
    }
  }
};

export default userService;
