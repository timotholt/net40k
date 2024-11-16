import mongoose from 'mongoose';
import { db } from '../database/database.js';
import crypto from 'crypto';

// Schema definition (but not initialization)
const schemaDefinition = {
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
        },
        set: function(v) {
            return this.type === 'game' ? v : undefined;
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
    deleted: {
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
        type: Date,
        default: Date.now
    },
    private: {
        type: Boolean,
        default: false
    },
    recipientId: {
        type: String,
        required: function() { 
            return this.private === true; 
        }
    }
};

// Firestore schema metadata
const firestoreSchema = {
    type: { type: 'string', required: true },
    userId: { type: 'string', required: true },
    gameId: { type: 'string' },
    username: { type: 'string', required: true },
    nickname: { type: 'string', required: true },
    deleted: { type: 'boolean', default: false },
    message: { type: 'string', required: true },
    timestamp: { type: 'date', default: () => new Date() },
    private: { type: 'boolean', default: false },
    recipientId: { type: 'string' }
};

let Chat;

export const ChatDB = {
    async init() {
        if (!Chat) {
            const schema = new mongoose.Schema(schemaDefinition);
            Chat = mongoose.model('Chat', schema);
            Chat.schema = firestoreSchema;
        }
        return Chat;
    },

    async findByType(type) {
        console.log('Enter findByType with type:', type);
        try {
            const model = await this.init();
            console.log('Getting database engine...');
            const engine = db.getEngine();
            console.log('Database engine obtained');

            console.log('Calling find with type:', type);
            const messages = await engine.find(model, { type });
            console.log('Find completed, messages:', messages);

            console.log('Sorting messages...');
            const sortedMessages = messages
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-100);
            console.log('Messages sorted, count:', sortedMessages.length);
            
            return sortedMessages;
        } catch (error) {
            console.error('Error in findByType:', error);
            throw error;
        }
    },

    async findByGame(gameId) {
        console.log('Enter findByGame with gameId:', gameId);
        try {
            const model = await this.init();
            const messages = await db.getEngine().find(model, { 
                type: 'game',
                gameId: gameId 
            });
            const sortedMessages = messages
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(-100);
            
            console.log(`Found ${sortedMessages.length} game messages`);
            return sortedMessages;
        } catch (error) {
            console.error('Error in findByGame:', error);
            throw error;
        }
    },

    async findOne(query) {
        console.log('Enter findOne with query:', query);
        try {
            const model = await this.init();
            return await db.getEngine().findOne(model, query);
        } catch (error) {
            console.error('Error in findOne:', error);
            throw error;
        }
    },

    async create(chatData) {
        console.log('Enter create with data:', chatData);

        // Ensure userId is generated if not provided
        if (!chatData._id) {
            chatData._id= crypto.randomUUID();
        }

        try {
            const model = await this.init();
            // Remove gameId if it's a lobby message
            const data = chatData.type === 'lobby' 
                ? { ...chatData, gameId: undefined }
                : chatData;

            // Remove undefined fields before saving
            Object.keys(data).forEach(key => 
                data[key] === undefined && delete data[key]
            );

            return await db.getEngine().create(model, data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    },

    async delete(query) {
        console.log('Enter delete with query:', query);
        try {
            const model = await this.init();
            return await db.getEngine().delete(model, query);
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    },

    async deleteByGame(gameId) {
        console.log('Enter deleteByGame with gameId:', gameId);
        try {
            const model = await this.init();
            return await this.delete({ 
                type: 'game',
                gameId: gameId
            });
        } catch (error) {
            console.error('Error in deleteByGame:', error);
            throw error;
        }
    },

    async update(query, data) {
        console.log('Enter update with query:', query, 'and data:', data);
        try {
            const model = await this.init();
            return await db.getEngine().update(model, query, data);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }
};