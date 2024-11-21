import axiosInstance from '../api/axiosConfig';

const gameService = {
  /**
   * Fetch list of games/games
   * @param {Object} filters - Optional filters for games
   * @param {Object} pagination - Pagination options
   * @returns {Promise<{games: Array, pagination: Object}>}
   */
  getGames: async (filters = {}, pagination = { page: 1, limit: 50 }) => {
    try {
      const response = await axiosInstance.get('/games', {
        params: {
          ...filters,
          ...pagination
        }
      });
      
      // Transform games to match existing GamesList expectations
      const transformedGames = response.data.map(game => ({
        id: game.gameUuid,
        name: game.name,
        description: game.description,
        players: game.players || [],
        maxPlayers: game.maxPlayers,
        hasPassword: game.hasPassword,
        createdBy: game.createdBy,
        turns: 0, // Add appropriate mapping if available
        turnLength: 500, // Default value, map appropriately
        isYours: game.isYours, // Use backend's isYours flag
        isFriendGame: false // Add logic for friend games if applicable
      }));

      return {
        games: transformedGames,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: response.data.length
        }
      };
    } catch (error) {
      console.error('Failed to fetch games:', error);
      throw error;
    }
  },

  /**
   * Create a new game/game
   * @param {Object} gameData - Game creation details
   * @returns {Promise<Object>}
   */
  createGame: async (gameData) => {
    try {
      const response = await axiosInstance.post('/games', gameData);
      return response.data;
    } catch (error) {
      console.error('Failed to create game:', error);
      throw error;
    }
  },

  /**
   * Delete a specific game
   * @param {string} gameUuid - UUID of the game to delete
   * @returns {Promise<void>}
   */
  deleteGame: async (gameUuid) => {
    try {
      await axiosInstance.delete(`/games/${gameUuid}`);
    } catch (error) {
      console.error('Failed to delete game:', error);
      throw error;
    }
  }
};

export default gameService;
