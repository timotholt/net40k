import mongoose from 'mongoose';
import { db } from '../database/database.js';
import { UuidService } from '../services/UuidService.js';
import { Lock } from './Lock.js';

// Schema definition (but not initialization)
const schemaDefinition = {
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1
  },
  creator: {
    type: String,  // This stores userId
    required: true
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    default: 4
  },
  password: {
    type: String,
    default: ''
  },
  players: [{
    type: String  // Array of userIds
  }],
  created: {
    type: Date,
    default: Date.now
  }
};

// Firestore schema metadata
const firestoreSchema = {
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  creator: { type: 'string', required: true },
  maxPlayers: { type: 'number', required: true },
  password: { type: 'string', default: '' },
  players: { type: 'array', default: [] },
  created: { type: 'date', default: () => new Date() }
};

let GameState;

export const GameStateDB = {
  async init() {
    if (!GameState) {
      const schema = new mongoose.Schema(schemaDefinition);
      GameState = mongoose.model('GameState', schema);
      GameState.schema = firestoreSchema;
    }
    return GameState;
  },

  async findAll() {
    const model = await this.init();
    return await db.getEngine().find(model, {});
  },

  async findOne(query) {
    const model = await this.init();
    return await db.getEngine().findOne(model, query);
  },

  async create(gameData) {
    const model = await this.init();

    // console.log('=================================================')
    // console.log('Creating game...');
    // console.log(gameData);

    // Ensure userId is generated if not provided
    if (!gameData._id) {
        gameData._id = UuidService.generate();
      }
  
      // Ensure a createdAt is generated if not provided
      if (!gameData.created) {
        gameData.created = Date.now();
      }
  

    return await db.getEngine().create(model, {
      ...gameData,
      id: UuidService.generate()
    });
  },

  async update(query, data) {
    const model = await this.init();
    return await db.getEngine().update(model, query, data);
  },

  async delete(query) {
    const model = await this.init();
    return await db.getEngine().delete(model, query);
  },

  async findByCreator(userId) {
    const model = await this.init();
    return await db.getEngine().find(model, { creator: userId });
  },

  async addPlayer(gameId, userId) {
    try {
      const release = await Lock.acquire(`game:${gameId}`);
      try {
        const model = await this.init();
        const game = await this.findOne({ id: gameId });
        if (!game) return null;

        const players = Array.isArray(game.players) ? game.players : [];
        
        if (players.length >= game.maxPlayers) {
          throw new Error('Game is full');
        }

        if (!players.includes(userId)) {
          players.push(userId);
          await this.update({ id: gameId }, { players });
        }
        return game;
      } finally {
        release();
      }
    } catch (error) {
      if (error.message.includes('locked')) {
        throw new Error('Game is currently busy, please try again');
      }
      throw error;
    }
  },

  async removePlayer(gameId, userId) {
    try {
      const release = await Lock.acquire(`game:${gameId}`);
      try {
        const model = await this.init();
        const game = await this.findOne({ id: gameId });
        if (!game) return null;

        const players = Array.isArray(game.players) ? game.players : [];
        const updatedPlayers = players.filter(id => id !== userId);
        
        await this.update({ id: gameId }, { players: updatedPlayers });
        return {
          ...game,
          players: updatedPlayers
        };
      } finally {
        release();
      }
    } catch (error) {
      if (error.message.includes('locked')) {
        throw new Error('Game is currently busy, please try again');
      }
      throw error;
    }
  },

  async isPlayerInGame(gameId, userId) {
    const model = await this.init();
    const game = await this.findOne({ id: gameId });
    const players = game ? (Array.isArray(game.players) ? game.players : []) : [];
    return players.includes(userId);
  }
};