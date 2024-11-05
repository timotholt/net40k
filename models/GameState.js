import mongoose from 'mongoose';
import { db } from '../database/database.js';
import crypto from 'crypto';
import { Lock } from './Lock.js';

const gameStateSchema = new mongoose.Schema({
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
});

export const GameState = mongoose.model('GameState', gameStateSchema);

// Add schema metadata for database engines
GameState.schema = {
  players: { type: 'array', default: [] }
};

export const GameStateDB = {
  async findAll() {
    return await db.getEngine().find(GameState, {});
  },

  async findOne(query) {
    return await db.getEngine().findOne(GameState, query);
  },

  async create(gameData) {
    return await db.getEngine().create(GameState, {
      ...gameData,
      id: crypto.randomUUID()
    });
  },

  async update(query, data) {
    return await db.getEngine().update(GameState, query, data);
  },

  async delete(query) {
    return await db.getEngine().delete(GameState, query);
  },

  async findByCreator(userId) {
    return await db.getEngine().find(GameState, { creator: userId });
  },

  async addPlayer(gameId, userId) {
    try {
      const release = await Lock.acquire(`game:${gameId}`);
      try {
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
    const game = await this.findOne({ id: gameId });
    const players = game ? (Array.isArray(game.players) ? game.players : []) : [];
    return players.includes(userId);
  }
};
