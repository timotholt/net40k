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
      
      // console.log('Raw games from backend:', response.data);

      const transformedGames = response.data.map(game => {
        const transformed = {
          id: game.gameUuid,
          gameUuid: game.gameUuid,
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
          isFriendGame: false
        };

        // console.log(`Transformed game ${game.gameUuid}:`, {
        //   hasPassword: transformed.hasPassword,
        //   originalHasPassword: game.hasPassword
        // });

        return transformed;
      });

      // console.log('Transformed games:', transformedGames);

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
   * @returns {Promise<Object>} Game settings object
   */
  getGameSettings: async (gameUuid) => {
    try {
      const response = await axiosInstance.get(`/games/${gameUuid}/settings`);
      
      // console.log('GAME SERVICE: Get Game Settings Response', {
      //   gameUuid,
      //   responseData: response.data,
      //   fullResponse: response
      // });

      return response.data;
    } catch (error) {
      console.error('Failed to fetch game settings:', {
        gameUuid,
        error: error.response?.data || error.message,
        fullError: error
      });
      throw error;
    }
  },

  /**
   * Update game settings
   * @param {string} gameUuid - UUID of the game to update
   * @param {Object} settingsData - Game settings to update
   * @returns {Promise<Object>} Updated game settings
   */
  updateGameSettings: async (gameUuid, settingsData) => {
    try {
      // console.log('Updating game settings:', { 
      //   gameUuid, 
      //   settingsData 
      // });

      // Ensure only specific fields are sent
      const allowedFields = ['name', 'description', 'maxPlayers', 'turnLength', 'hasPassword', 'password'];
      const safeSettingsData = Object.keys(settingsData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = settingsData[key];
          return obj;
        }, {});

      // console.log('Safe settings data:', safeSettingsData);

      const response = await axiosInstance.patch(`/games/${gameUuid}/settings`, safeSettingsData);
      
      // console.log('Update game settings response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to update game settings:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetch list of game victories
   * @param {Object} options - Options for fetching victories
   * @param {number} options.limit - Maximum number of victories to fetch
   * @returns {Promise<{victories: Array}>}
   */
  getVictories: async ({ limit = 50 } = {}) => {
    try {
      const response = await axiosInstance.get('/games/victories', {
        params: { limit }
      });
      
      return {
        victories: response.data.map(victory => ({
          gameUuid: victory.gameUuid,
          players: victory.players || [],  // Array of player UUIDs
          nickname: victory.nickname,
          faction: victory.faction,
          type: victory.type,
          description: victory.description,
          turnCount: victory.turnCount,
          timestamp: victory.timestamp
        }))
      };
    } catch (error) {
      console.error('Error fetching victories:', error);
      return { victories: [] };
    }
  }
};

export default gameService;
