import { 
  createGameUuid, 
  COUNTRY, 
  DATACENTER, 
} from '@net40k/shared/constants/GameUuids';
import DateService from '../services/DateService.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { generateSchema } from '../utils/schemaGenerator.js';
import { db } from '../database/database.js';
import { Lock } from './Lock.js';

class Game {
  constructor(data = {}) {
    // Sanitize and validate input data
    this.gameUuid = data.gameUuid || createGameUuid(
      data.country || COUNTRY.US,
      data.datacenter || DATACENTER.US_WEST
    );
    
    this.name = data.name;
    this.description = data.description || '';
    this.creatorUuid = data.creatorUuid;
    
    // Secure password handling
    this.hasPassword = !!data.password;
    this.password = data.password || null;
    
    this.playerUuids = data.playerUuids || [data.creatorUuid].filter(Boolean);
    this.viewerUuids = data.viewerUuids || [];
    
    this.maxPlayers = data.maxPlayers || 4;
    this.status = data.status || 'WAITING';
    
    this.turn = {
      number: data.turn?.number || 0,
      startTime: data.turn?.startTime || DateService.now().date,
      endTime: data.turn?.endTime || null,
      playerTurns: data.turn?.playerTurns || []
    };
    
    this.createdAt = data.createdAt || DateService.now().date;
    this.updatedAt = data.updatedAt || DateService.now().date;
    
    // Additional metadata
    this.metadata = data.metadata || {};
    this.isPrivate = data.isPrivate || false;
  }

  // Password verification method
  verifyPassword(inputPassword) {
    return this.password === inputPassword;
  }

  validate() {
    if (!this.name || this.name.length < 3) {
      throw new ValidationError('game name must be at least 3 characters long');
    }

    if (!this.creatorUuid) {
      throw new ValidationError('game must have a creator');
    }

    if (this.playerUuids.length > this.maxPlayers) {
      throw new ValidationError('Too many players in the game');
    }
  }

  // Schema for database validation
  static schema = generateSchema(new Game(), {
    name: { type: 'string', required: true, minLength: 3 },
    creatorUuid: { type: 'string', required: true },
    status: { type: 'string', enum: ['WAITING', 'IN_PROGRESS', 'CLOSED'] },
    maxPlayers: { type: 'number', min: 2, max: 10 },
    hasPassword: { type: 'boolean', default: false },
    password: { type: 'string', required: false }
  });

  toJSON() {
    return this.toFullGame();
  }

  toFullGame() {
    return {
      gameUuid: this.gameUuid,
      name: this.name,
      description: this.description,
      creatorUuid: this.creatorUuid,
      playerUuids: this.playerUuids,
      viewerUuids: this.viewerUuids,
      maxPlayers: this.maxPlayers,
      status: this.status,
      hasPassword: this.hasPassword,
      password: this.password,
      turn: this.turn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
      isPrivate: this.isPrivate
    };
  }

  toPublicGame() {
    return {
      gameUuid: this.gameUuid,
      name: this.name,
      description: this.description,
      playerCount: this.playerUuids.length,
      maxPlayers: this.maxPlayers,
      status: this.status,
      hasPassword: this.hasPassword,
      isPrivate: this.isPrivate,
      createdBy: {
        uuid: this.creatorUuid,
        nickname: this.creatorUuid // This will be replaced by actual nickname in GameService
      }
    };
  }
}

export const GameDB = {
  collection: 'game',

  async init() {
    await db.createCollection(this.collection);
    
    if (db.supportsExplicitIndexes) {
      await db.createIndex(this.collection, { gameUuid: 1 }, { unique: true });
      await db.createIndex(this.collection, { creatorUuid: 1 });
      await db.createIndex(this.collection, { status: 1 });
    } else {
      logger.info('Database engine does not support explicit indexes');
    }
  },

  async create(gameData) {
    const lockId = `game-create-${gameData.name}-${gameData.creatorUuid}`;
    
    try {
      await Lock.acquire(lockId, 1000);
      
      const game = new Game(gameData);
      game.validate();

      // Check for existing game with same name (optional)
      const existinggame = await this.findOne({ 
        name: game.name, 
        creatorUuid: game.creatorUuid 
      });

      if (existinggame) {
        throw new ValidationError('game with this name already exists');
      }

      console.log('GameDB.create - Attempting to create game:', game.toJSON());
      console.log('GameDB.create - Using collection:', this.collection);
      console.log('GameDB.create - Database object:', db);

      const result = await db.create(this.collection, game.toJSON());
      logger.info(`game created successfully: ${game.name}`);
      
      return this._toGameInstance(result);
    } catch (error) {
      console.error('GameDB.create - Full error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      logger.error(`Failed to create game: ${error.message}`);
      throw error;
    } finally {
      await Lock.release(lockId);
    }
  },

  async findOne(query) {
    const result = await db.findOne(this.collection, query);
    return result ? this._toGameInstance(result) : null;
  },

  async find(query = {}, options = {}) {
    const results = await db.find(this.collection, query, options);
    return results.map(result => this._toGameInstance(result));
  },

  async update(query, updateData) {
    const result = await db.update(this.collection, query, updateData);
    return this._toGameInstance(result);
  },

  async delete(query) {
    await db.delete(this.collection, query);
    return true;
  },

  _toGameInstance(dbObject) {
    return dbObject ? new Game(dbObject) : null;
  }
};

export default Game;
