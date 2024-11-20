import axiosInstance from './axiosConfig';
import logger from '../utils/logger';

class PlayerService {
  async initialize() {
    logger.info('Initializing PlayerService...');
    return this;
  }

  // Fetch all players
  async getAllPlayers() {
    try {
      logger.info('Fetching all players');
      const response = await axiosInstance.get('/players');
      logger.info('Players fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Error fetching players', { 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }

  // Get player by ID
  async getPlayerById(playerId) {
    try {
      logger.info('Fetching player by ID', { playerId });
      const response = await axiosInstance.get(`/players/${playerId}`);
      logger.info('Player fetched successfully', { playerId });
      return response.data;
    } catch (error) {
      logger.error('Error fetching player', { 
        playerId, 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }

  // Create a new player
  async createPlayer(playerData) {
    try {
      logger.info('Creating new player', { playerData });
      const response = await axiosInstance.post('/players', playerData);
      logger.info('Player created successfully', { playerId: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Error creating player', { 
        message: error.message, 
        response: error.response?.data 
      });
      throw error;
    }
  }
}

// Create and export a singleton instance
const playerService = new PlayerService();
export { playerService };
