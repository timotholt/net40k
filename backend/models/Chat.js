import mongoose from 'mongoose';
import { db } from '../database/database.js';
import { UuidService } from '../services/UuidService.js';
import DateService from '../services/DateService.js';

// Service Layer: Chat Representation
class Chat {
    constructor(data = {}) {
        this.chatId = data.chatId || UuidService.generate();
        this.userId = data.userId;
        this.gameId = data.type === 'game' ? data.gameId : null;
        this.username = data.username;
        this.nickname = data.nickname;
        this.message = data.message;
        this.timestamp = data.timestamp || DateService.now();
        this.isPrivate = data.isPrivate || false;
        this.recipientId = data.isPrivate ? data.recipientId : null;
        this.isDeleted = data.isDeleted || false;
    }

    toJSON() {
        return {
            chatId: this.chatId,
            type: this.type,
            userId: this.userId,
            gameId: this.gameId,
            username: this.username,
            nickname: this.nickname,
            message: this.message,
            timestamp: this.timestamp,
            isPrivate: this.isPrivate,
            recipientId: this.recipientId
        };
    }

    validate() {
        if (!this.userId) {
            throw new Error('User ID is required');
        }
        if (!this.message || this.message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        if (this.type === 'game' && !this.gameId) {
            throw new Error('Game ID is required for game-type messages');
        }
        if (this.isPrivate && !this.recipientId) {
            throw new Error('Recipient ID is required for private messages');
        }
        return true;
    }
}

// Database Layer Schema
const schemaDefinition = {
    _id: {
        type: String,
        default: UuidService.generate
    },
    chatId: {
        type: String,
        required: true,
        unique: true,
        default: UuidService.generate
    },
    type: {
        type: String,
        enum: ['lobby', 'game'],
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    gameId: {
        type: String,
        required: function() { 
            return this.type === 'game'; 
        }
    },
    username: {
        type: String,
        required: true
    },
    nickname: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    timestamp: {
        type: mongoose.Schema.Types.Mixed,
        default: () => {
            const now = new Date();
            return {
                date: now,
                timestamp: now.getTime()
            };
        }
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    recipientId: {
        type: String,
        required: function() { 
            return this.isPrivate === true; 
        }
    }
};

export const ChatDB = {
    _model: null,

    async init() {
        if (!this._model) {
            const schema = new mongoose.Schema(schemaDefinition);
            this._model = mongoose.model('Chat', schema);
        }
        return this._model;
    },

    async findByType(type) {
        const model = await this.init();
        const messages = await db.getEngine().find(model, { type });
        const sortedMessages = messages
            .sort((a, b) => a.timestamp.date - b.timestamp.date)
            .slice(-100)
            .map(msg => new Chat(msg));
        
        return sortedMessages;
    },

    async findByGame(gameId) {
        const model = await this.init();
        const messages = await db.getEngine().find(model, { 
            type: 'game',
            gameId: gameId 
        });
        const sortedMessages = messages
            .sort((a, b) => a.timestamp.date - b.timestamp.date)
            .slice(-100)
            .map(msg => new Chat(msg));
        
        return sortedMessages;
    },

    async findOne(query) {
        const model = await this.init();
        const dbRecord = await db.getEngine().findOne(model, query);
        return dbRecord ? new Chat(dbRecord) : null;
    },

    async create(chatData) {
        const model = await this.init();

        // Create service layer chat
        const chat = new Chat(chatData);
        
        // Validate chat data
        chat.validate();

        // Prepare data for database
        const dbData = {
            ...chatData,
            chatId: chat.chatId,
            gameId: chat.type === 'game' ? chat.gameId : undefined,
            isDeleted: false
        };

        // Remove undefined fields
        Object.keys(dbData).forEach(key => 
            dbData[key] === undefined && delete dbData[key]
        );

        const dbRecord = await db.getEngine().create(model, dbData);
        return new Chat(dbRecord);
    },

    async delete(query) {
        const model = await this.init();
        return await db.getEngine().delete(model, query);
    },

    async deleteByGame(gameId) {
        const model = await this.init();
        return await db.getEngine().delete(model, { 
            type: 'game', 
            gameId: gameId 
        });
    },

    async update(query, data) {
        const model = await this.init();
        const updatedRecord = await db.getEngine().update(model, query, data);
        return updatedRecord ? new Chat(updatedRecord) : null;
    }
};