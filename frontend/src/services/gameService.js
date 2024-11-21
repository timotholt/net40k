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
        gameUuid: game.gameUuid,  // Explicitly add gameUuid
        name: game.name,
        description: game.description,
        players: game.players || [],
        maxPlayers: game.maxPlayers,
        hasPassword: game.hasPassword,
        creatorUuid: game.creatorUuid,
        creatorNickname: game.creatorNickname || 'Unknown Creator',
        turns: game.turns || 0, 
        turnLength: game.turnLength || 500, 
        isYours: game.isYours || false,
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
  },

  /**
   * Fetch specific game settings
   * @param {string} gameUuid - UUID of the game to fetch settings for
   * @returns {Promise<Object>}
   */
  getGameSettings: async (gameUuid) => {
    try {
      const response = await axiosInstance.get(`/games/${gameUuid}/settings`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch game settings:', error);
      throw error;
    }
  },

  /**
   * Update game settings
   * @param {string} gameUuid - UUID of the game to update
   * @param {Object} settingsData - Game settings to update
   * @returns {Promise<Object>}
   */
  updateGameSettings: async (gameUuid, settingsData) => {
    try {
      const response = await axiosInstance.put(`/games/${gameUuid}/settings`, settingsData);
      return response.data;
    } catch (error) {
      console.error('Failed to update game settings:', error);
      throw error;
    }
  }
};

export default gameService;
