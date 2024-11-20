import axiosInstance from './axiosConfig';
import logger from '../utils/logger';

class GameService {
  async initialize() {
    logger.info('Initializing GameService...');
    return this;
  }

  // Fetch all games
  async getAllGames() {
    try {
      logger.info('Fetching all games');
      const response = await axiosInstance.get('/games');
      logger.info('Games fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Error fetching games', { 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }

  // Get game by ID
  async getGameById(gameId) {
    try {
      logger.info('Fetching game by ID', { gameId });
      const response = await axiosInstance.get(`/games/${gameId}`);
      logger.info('Game fetched successfully', { gameId });
      return response.data;
    } catch (error) {
      logger.error('Error fetching game', { 
        gameId, 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }

  // Create a new game
  async createGame(gameData) {
    try {
      logger.info('Creating new game', { gameData });
      const response = await axiosInstance.post('/games', gameData);
      logger.info('Game created successfully', { gameId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Error creating game', { 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }
}

// Create and export a singleton instance
const gameService = new GameService();
export { gameService };
