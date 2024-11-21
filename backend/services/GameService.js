import { 
  createGameUuid, 
  COUNTRY, 
  DATACENTER, 
  GAME_TYPE 
} from '@net40k/shared/constants/GameUuids';
import { GameDB } from '../models/Game.js';
import { UserDB } from '../models/User.js';
import logger from '../utils/logger.js';
import { ValidationError, AuthorizationError } from '../utils/errors.js';

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

  async listGames(filters = {}, userUuid = null) {
    try {
      // Find games based on initial filters
      const games = await GameDB.find(filters);
      
      // If a user UUID is provided, find additional games created by this user
      let userGames = [];
      if (userUuid) {
        userGames = await GameDB.find({ creatorUuid: userUuid });
      }

      // Combine games, removing duplicates
      const combinedGames = [...games, ...userGames].filter(
        (game, index, self) => 
          index === self.findIndex((t) => t.gameUuid === game.gameUuid)
      );
      
      // Get all unique creator UUIDs
      const creatorUuids = [...new Set(combinedGames.map(game => game.creatorUuid))];
      
      // Fetch all creators in one query
      const creators = await Promise.all(
        creatorUuids.map(uuid => UserDB.findOne({ userUuid: uuid }))
      );
      
      // Create a map of UUID to nickname
      const creatorMap = new Map(
        creators.filter(Boolean).map(user => [user.userUuid, user.nickname])
      );

      // Map games and populate creator info
      return combinedGames.map(game => {
        const publicGame = game.toPublicGame();
        publicGame.creatorNickname = creatorMap.get(game.creatorUuid) || 'Unknown';
        
        // Mark games created by the user
        publicGame.isYours = userUuid ? game.creatorUuid === userUuid : false;
        
        return publicGame;
      });
    } catch (error) {
      logger.error(`List games failed: ${error.message}`);
      throw error;
    }
  }

  async updateGame(gameUuid, userUuid, updates) {
    console.log('Backend updateGame called with:', { 
      gameUuid, 
      userUuid, 
      updates 
    });

    try {
      // Check user privileges first
      const userPrivileges = await this.userService.hasSpecialPrivileges(userUuid);
      
      // Find the game first
      const game = await GameDB.findOne({ gameUuid });
      
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }

      // Authorization checks
      const isCreator = game.creatorUuid === userUuid;
      const hasSpecialAccess = userPrivileges.hasSpecialAccess;

      // Only allow update if:
      // 1. User is the game creator, OR
      // 2. User has special access (admin, active)
      if (!(isCreator || hasSpecialAccess)) {
        throw new AuthorizationError('You are not authorized to update this game\'s settings');
      }

      // Validate update fields
      const allowedFields = [
        'name', 
        'description', 
        'maxPlayers', 
        'turnLength', 
        'hasPassword', 
        'password'
      ];
      
      // Filter out any unexpected fields
      const safeUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key];
          return obj;
        }, {});

      console.log('Safe updates:', safeUpdates);
      
      // Specific password logic
      if (safeUpdates.hasPassword !== undefined) {
        if (safeUpdates.hasPassword && !safeUpdates.password) {
          throw new ValidationError('Password is required when hasPassword is true');
        }
        if (!safeUpdates.hasPassword) {
          // Clear password if hasPassword is false
          safeUpdates.password = null;
        }
      }

      console.log('Final safe updates:', safeUpdates);

      // Prevent modification of critical fields
      delete safeUpdates.gameUuid;
      delete safeUpdates.creatorUuid;
      delete safeUpdates.createdAt;
    
      // Add updatedAt timestamp
      safeUpdates.updatedAt = DateService.now().date;

      // Perform the update
      await GameDB.update({ gameUuid }, safeUpdates);

      // Retrieve and return the updated game
      const updatedGame = await GameDB.findOne({ gameUuid });
      
      logger.info(`Game updated: ${gameUuid}`);
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

  async deleteGame(gameUuid, requestingUserUuid, isAdmin = false) {
    try {
      // Find the game first
      const game = await GameDB.findOne({ gameUuid });
      
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }

      // Check if the requesting user is the game creator or an admin
      const isCreator = game.creatorUuid === requestingUserUuid;
      if (!isCreator && !isAdmin) {
        throw new AuthorizationError('Not authorized to delete this game');
      }

      // If not an admin, additional checks on game status
      if (!isAdmin && game.status !== 'WAITING') {
        throw new ValidationError('Cannot delete a game that is not in waiting status');
      }

      // Perform deletion
      await GameDB.delete({ gameUuid });

      // Optional: Log deletion event
      logger.info(`Game deleted: ${gameUuid} by user ${requestingUserUuid} ${isAdmin ? '(ADMIN)' : ''}`);

      return true;
    } catch (error) {
      logger.error(`Delete game failed: ${error.message}`);
      throw error;
    }
  }

  async getGameSettings(gameUuid, userUuid) {
    try {
      const game = await GameDB.findOne({ gameUuid });
      
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }

      // Check if user is the creator or an admin
      if (game.creatorUuid !== userUuid) {
        throw new AuthorizationError('You are not authorized to view this game\'s settings');
      }

      return {
        name: game.name,
        description: game.description || '',
        maxPlayers: game.maxPlayers,
        turnLength: game.turnLength || 500,
        hasPassword: game.hasPassword
      };
    } catch (error) {
      logger.error(`Get game settings failed: ${error.message}`);
      throw error;
    }
  }

  async updateGameSettings(gameUuid, userUuid, settingsData) {
    try {
      const game = await GameDB.findOne({ gameUuid });
      
      if (!game) {
        throw new ValidationError(`Game with UUID ${gameUuid} not found`);
      }

      // Check if user is the creator or an admin
      if (game.creatorUuid !== userUuid) {
        throw new AuthorizationError('You are not authorized to update this game\'s settings');
      }

      // Validate and update settings
      if (settingsData.name) game.name = settingsData.name.trim();
      if (settingsData.description !== undefined) game.description = settingsData.description.trim();
      if (settingsData.maxPlayers) game.maxPlayers = settingsData.maxPlayers;
      if (settingsData.turnLength) game.turnLength = settingsData.turnLength;
      
      // Handle password update
      if (settingsData.password !== undefined) {
        game.password = settingsData.password.trim();
        game.hasPassword = !!settingsData.password.trim();
      }

      await game.save();

      logger.info(`Game settings updated: ${gameUuid}`);
      return game.toPublicGame();
    } catch (error) {
      logger.error(`Update game settings failed: ${error.message}`);
      throw error;
    }
  }
}

export default new GameService();
