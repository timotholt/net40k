import axiosInstance from '../api/axiosConfig';

const roomService = {
  /**
   * Fetch list of rooms/games
   * @param {Object} filters - Optional filters for rooms
   * @param {Object} pagination - Pagination options
   * @returns {Promise<{rooms: Array, pagination: Object}>}
   */
  getRooms: async (filters = {}, pagination = { page: 1, limit: 50 }) => {
    try {
      const response = await axiosInstance.get('/rooms', {
        params: {
          ...filters,
          ...pagination
        }
      });
      
      // Transform rooms to match existing GamesList expectations
      const transformedRooms = response.data.map(room => ({
        id: room.uuid,
        name: room.name,
        description: room.description,
        players: room.players || [],
        maxPlayers: room.maxPlayers,
        isPasswordProtected: !!room.password,
        createdBy: {
          nickname: room.creatorUsername || 'Unknown'
        },
        turns: 0, // Add appropriate mapping if available
        turnLength: 500, // Default value, map appropriately
        isYours: false, // Add logic to determine if current user created the room
        isFriendGame: false // Add logic for friend games if applicable
      }));

      return {
        rooms: transformedRooms,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: response.data.length
        }
      };
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      throw error;
    }
  },

  /**
   * Create a new room/game
   * @param {Object} roomData - Room creation details
   * @returns {Promise<Object>}
   */
  createRoom: async (roomData) => {
    try {
      const response = await axiosInstance.post('/rooms', roomData);
      return response.data;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  },

  /**
   * Delete a specific room
   * @param {string} roomUuid - UUID of the room to delete
   * @returns {Promise<void>}
   */
  deleteRoom: async (roomUuid) => {
    try {
      await axiosInstance.delete(`/rooms/${roomUuid}`);
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw error;
    }
  }
};

export default roomService;
