import { 
  createGameUuid, 
  COUNTRY, 
  DATACENTER, 
  GAME_TYPE 
} from '@net40k/shared/constants/GameUuids';
import { GameDB } from '../models/Game.js';
import { UserDB } from '../models/User.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

class GameService {
  constructor() {
    // Initialization if needed
  }

  async createGame(name, description, creatorUuid, maxPlayers, password = '') {
    try {
      const gameData = {
        name,
        description,
        creatorUuid,
        maxPlayers,
        password: password.trim(),  // Trim password to handle empty strings
        hasPassword: !!password.trim(),  // Set hasPassword based on password existence
        country: COUNTRY.US,
        gameType: GAME_TYPE.LOBBY,
        datacenter: DATACENTER.US_WEST
      };

      const game = await GameDB.create(gameData);
      logger.info(`Game created: ${game.gameUuid}`);
      return game.toPublicGame();
    } catch (error) {
      logger.error(`Game creation failed: ${error.message}`);
      throw error;
    }
  }

  async getGame(gameUuid) {
    try {
      const game = await GameDB.findOne({ gameUuid });
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }
      return game.toFullGame();
    } catch (error) {
      logger.error(`Get game failed: ${error.message}`);
      throw error;
    }
  }

  async listGames(filters = {}) {
    try {
      const games = await GameDB.find(filters);
      
      // Get all unique creator UUIDs
      const creatorUuids = [...new Set(games.map(game => game.creatorUuid))];
      
      // Fetch all creators in one query
      const creators = await Promise.all(
        creatorUuids.map(uuid => UserDB.findOne({ userUuid: uuid }))
      );
      
      // Create a map of UUID to nickname
      const creatorMap = new Map(
        creators.filter(Boolean).map(user => [user.userUuid, user.nickname])
      );

      // Map games and populate creator info
      return games.map(game => {
        const publicGame = game.toPublicGame();
        publicGame.createdBy = {
          uuid: game.creatorUuid,
          nickname: creatorMap.get(game.creatorUuid) || 'Unknown'
        };
        return publicGame;
      });
    } catch (error) {
      logger.error(`List games failed: ${error.message}`);
      throw error;
    }
  }

  async updateGame(gameUuid, updates) {
    try {
      // Prevent modification of critical fields
      const safeUpdates = { ...updates };
      delete safeUpdates.gameUuid;
      delete safeUpdates.creatorUuid;
      delete safeUpdates.createdAt;

      const updatedGame = await GameDB.update({ gameUuid }, safeUpdates);
      return updatedGame.toFullGame();
    } catch (error) {
      logger.error(`Update game failed: ${error.message}`);
      throw error;
    }
  }

  async joinGame(gameUuid, playerUuid) {
    try {
      const game = await GameDB.findOne({ gameUuid });
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }

      // Check if player is already in the game
      if (game.playerUuids.includes(playerUuid)) {
        return game.toFullGame();
      }

      // Check max players
      if (game.playerUuids.length >= game.maxPlayers) {
        throw new ValidationError('Game is full');
      }

      // Add player
      const updatedGame = await GameDB.update(
        { gameUuid }, 
        { 
          $push: { playerUuids: playerUuid },
          status: game.playerUuids.length + 1 === game.maxPlayers ? 'IN_PROGRESS' : 'WAITING'
        }
      );

      return updatedGame.toFullGame();
    } catch (error) {
      logger.error(`Join game failed: ${error.message}`);
      throw error;
    }
  }

  async leaveGame(gameUuid, playerUuid) {
    try {
      const game = await GameDB.findOne({ gameUuid });
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }

      // Determine new status
      let newStatus = game.status;
      if (playerUuid === game.creatorUuid) {
        newStatus = 'CLOSED';
      } else if (game.status === 'IN_PROGRESS' && game.playerUuids.length <= game.maxPlayers) {
        newStatus = 'WAITING';
      }

      // Update game
      const updatedGame = await GameDB.update(
        { gameUuid },
        { 
          $pull: { playerUuids: playerUuid },
          status: newStatus
        }
      );

      return updatedGame.toFullGame();
    } catch (error) {
      logger.error(`Leave game failed: ${error.message}`);
      throw error;
    }
  }

  async deleteGame(gameUuid) {
    try {
      await GameDB.delete({ gameUuid });
      return true;
    } catch (error) {
      logger.error(`Delete game failed: ${error.message}`);
      throw error;
    }
  }
}

export default new GameService();
