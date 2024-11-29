import { 
  createGameUuid, 
  COUNTRY, 
  DATACENTER, 
  GAME_TYPE 
} from '@net40k/shared/constants/GameUuids';
import { GameDB } from '../models/Game.js';
import { UserDB } from '../models/User.js';
import logger from '../utils/logger.js';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors.js';

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
      console.log('LIST GAMES - Input:', { 
        filters, 
        userUuid 
      });

      // Debug: Log the call stack to see where this is being called from
      console.trace('LIST GAMES - Call Stack');

      // Find games based on initial filters
      const games = await GameDB.find(filters);
      console.log('LIST GAMES - Initial Games Found:', games.map(g => ({
        gameUuid: g.gameUuid,
        name: g.name,
        creatorUuid: g.creatorUuid
      })));
      
      // If a user UUID is provided, find additional games created by this user
      let userGames = [];
      if (userUuid) {
        userGames = await GameDB.find({ creatorUuid: userUuid });
        console.log('LIST GAMES - User Games Found:', userGames.map(g => ({
          gameUuid: g.gameUuid,
          name: g.name,
          creatorUuid: g.creatorUuid
        })));
      }

      // Combine games, removing duplicates
      const combinedGames = [...games, ...userGames].filter(
        (game, index, self) => 
          index === self.findIndex((t) => t.gameUuid === game.gameUuid)
      );
      
      console.log('LIST GAMES - Combined Games:', combinedGames.map(g => ({
        gameUuid: g.gameUuid,
        name: g.name,
        creatorUuid: g.creatorUuid
      })));
      
      // Get all unique creator UUIDs
      const creatorUuids = [...new Set(combinedGames.map(game => game.creatorUuid))];
      
      // Fetch all creators in one query
      const creators = await Promise.all(
        creatorUuids.map(uuid => UserDB.findOne({ userUuid: uuid }))
      );
      
      console.log('LIST GAMES - Creators:', creators.map(c => ({
        userUuid: c?.userUuid,
        nickname: c?.nickname
      })));
      
      // Create a map of UUID to nickname
      const creatorMap = new Map(
        creators.filter(Boolean).map(user => [user.userUuid, user.nickname])
      );

      // Map games and populate creator info
      const result = combinedGames.map(game => {
        const publicGame = game.toPublicGame();
        publicGame.creatorNickname = creatorMap.get(game.creatorUuid) || 'Unknown';
        
        // Mark games created by the user
        publicGame.isYours = userUuid ? game.creatorUuid === userUuid : false;
        
        // Check if user is a player in the game
        publicGame.isJoined = userUuid ? game.playerUuids.includes(userUuid) : false;
        
        return publicGame;
      });

      console.log('LIST GAMES - Final Result:', result.map(g => ({
        gameUuid: g.gameUuid,
        name: g.name,
        creatorNickname: g.creatorNickname,
        isYours: g.isYours,
        isJoined: g.isJoined
      })));
      
      return result;
    } catch (error) {
      logger.error(`List games failed: ${error.message}`);
      console.error('LIST GAMES - Detailed Error:', error);
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
      // Check admin privileges first
      const adminPrivileges = await this.userService.hasSpecialPrivileges(userUuid);
      
      // Find the game first
      const game = await GameDB.findOne({ gameUuid });
      
      if (!game) {
        throw new NotFoundError('Game not found');
      }

      // Check creator or special access
      const isCreator = game.creatorUuid === userUuid;

      // Authorization check
      // 1. User is creator
      // 2. User has special access (admin, active)
      if (!(isCreator || adminPrivileges)) {
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

      console.log('Safe updates before password check:', safeUpdates);
      
      // Specific password logic with more detailed validation
      if (safeUpdates.hasPassword !== undefined) {
        // If hasPassword is true, password must be provided and non-empty
        if (safeUpdates.hasPassword === true) {
          if (!safeUpdates.password || safeUpdates.password.trim() === '') {
            throw new ValidationError('A non-empty password is required when hasPassword is true');
          }
        }
        
        // If hasPassword is false, clear the password
        if (safeUpdates.hasPassword === false) {
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

      // Return the updated game
      return await this.getGameSettings(gameUuid);
    } catch (error) {
      console.error('Game update error:', error);
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

      console.log('GET GAME SETTINGS - Full Game Data', {
        gameUuid,
        userUuid,
        hasPassword: game.hasPassword,
        password: game.password ? '[REDACTED]' : null,
        fullGameData: game
      });

      return {
        gameUuid: game.gameUuid,
        name: game.name,
        description: game.description || '',
        maxPlayers: game.maxPlayers,
        turnLength: game.turnLength || 500,
        hasPassword: game.hasPassword,
        password: game.hasPassword ? game.password : null,
        creatorUuid: game.creatorUuid
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

      // Prepare update object
      const updateData = {};
      
      // Validate and update settings
      if ('name' in settingsData) {
        updateData.name = settingsData.name === null ? '' : settingsData.name.trim();
      }
      
      if ('description' in settingsData) {
        updateData.description = settingsData.description === null ? '' : settingsData.description.trim();
      }
      
      if ('maxPlayers' in settingsData) {
        updateData.maxPlayers = settingsData.maxPlayers;
      }
      
      if ('turnLength' in settingsData) {
        updateData.turnLength = settingsData.turnLength;
      }
      
      // Explicit password and hasPassword handling
      if ('password' in settingsData) {
        // Allow setting to empty string or null
        updateData.password = settingsData.password === null ? '' : settingsData.password.trim();
        
        // Explicitly set hasPassword based on password presence
        updateData.hasPassword = settingsData.password !== null && settingsData.password.trim() !== '';
      }
      
      // If hasPassword is explicitly provided, override password-based logic
      if ('hasPassword' in settingsData) {
        updateData.hasPassword = !!settingsData.hasPassword;
        
        // If hasPassword is false, clear the password
        if (!settingsData.hasPassword) {
          updateData.password = '';
        }
      }

      // Update the game in the database
      const updatedGame = await GameDB.update({ gameUuid }, updateData);

      logger.info(`Game settings updated: ${gameUuid}`, {
        updatedFields: Object.keys(updateData),
        hasPassword: updatedGame.hasPassword
      });

      return updatedGame.toPublicGame();
    } catch (error) {
      logger.error(`Update game settings failed: ${error.message}`, {
        gameUuid,
        settingsData: Object.keys(settingsData)
      });
      throw error;
    }
  }
}

export default new GameService();
