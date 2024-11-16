import mongoose from 'mongoose';
import { db } from '../database/database.js';
import { UuidService } from '../services/UuidService.js';
import { Lock } from './Lock.js';
import DateService from '../services/DateService.js';

// Service Layer: Game State Representation
class GameState {
    constructor(data = {}) {
        this.gameId = data.gameId || UuidService.generate();
        this.name = data.name;
        this.creatorId = data.creatorId;
        this.maxPlayers = data.maxPlayers || 4;
        this.playerIds = data.playerIds || [];
        this.createdAt = data.createdAt || DateService.now().date;
        this.isPrivate = data.isPrivate || false;
        this.password = data.password || null;
    }

    toJSON() {
        return {
            gameId: this.gameId,
            name: this.name,
            creatorId: this.creatorId,
            maxPlayers: this.maxPlayers,
            playerIds: this.playerIds,
            createdAt: this.createdAt,
            isPrivate: this.isPrivate
        };
    }
}

// Database Layer Schema
const schemaDefinition = {
    _id: {
        type: String,
        default: UuidService.generate
    },
    gameId: {
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
    creatorId: {
        type: String,
        required: true
    },
    maxPlayers: {
        type: Number,
        required: true,
        min: 1,
        max: 4,
        default: 4
    },
    playerIds: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: () => DateService.now().date
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        default: null
    }
};

export const GameStateDB = {
    _model: null,

    async init() {
        if (!this._model) {
            const schema = new mongoose.Schema(schemaDefinition);
            this._model = mongoose.model('GameState', schema);
        }
        return this._model;
    },

    async create(gameStateData) {
        const model = await this.init();
        
        // Ensure gameId is present and valid
        if (!gameStateData.gameId) {
            gameStateData.gameId = UuidService.generate();
        }
        
        // Validate gameId
        if (!UuidService.validate(gameStateData.gameId)) {
            throw new Error('Invalid gameId');
        }

        // Create database record
        const dbRecord = await db.getEngine().create(model, gameStateData);
        
        // Convert to service layer representation
        return new GameState(dbRecord);
    },

    async findAll() {
        const model = await this.init();
        const dbRecords = await db.getEngine().find(model, {});
        return dbRecords.map(record => new GameState(record));
    },

    async findOne(query) {
        const model = await this.init();
        const dbRecord = await db.getEngine().findOne(model, query);
        return dbRecord ? new GameState(dbRecord) : null;
    },

    async delete(query) {
        const model = await this.init();
        return await db.getEngine().delete(model, query);
    },

    async update(query, updateData) {
        const model = await this.init();
        const updatedRecord = await db.getEngine().update(model, query, updateData);
        return updatedRecord ? new GameState(updatedRecord) : null;
    },

    async findByCreator(userId) {
        const model = await this.init();
        const dbRecords = await db.getEngine().find(model, { creatorId: userId });
        return dbRecords.map(record => new GameState(record));
    },

    async addPlayer(gameId, userId) {
        try {
            const release = await Lock.acquire(`game:${gameId}`);
            try {
                const model = await this.init();
                const game = await this.findOne({ gameId });
                if (!game) return null;

                const playerIds = Array.isArray(game.playerIds) ? game.playerIds : [];
                
                if (playerIds.length >= game.maxPlayers) {
                    throw new Error('Game is full');
                }

                if (!playerIds.includes(userId)) {
                    playerIds.push(userId);
                    await this.update({ gameId }, { playerIds });
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
                const game = await this.findOne({ gameId });
                if (!game) return null;

                const playerIds = Array.isArray(game.playerIds) ? game.playerIds : [];
                const updatedPlayerIds = playerIds.filter(id => id !== userId);
                
                await this.update({ gameId }, { playerIds: updatedPlayerIds });
                return {
                    ...game,
                    playerIds: updatedPlayerIds
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
        const game = await this.findOne({ gameId });
        const playerIds = game ? (Array.isArray(game.playerIds) ? game.playerIds : []) : [];
        return playerIds.includes(userId);
    }
};