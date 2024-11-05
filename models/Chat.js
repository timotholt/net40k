import mongoose from 'mongoose';
import { db } from '../database/database.js';

const chatSchema = new mongoose.Schema({
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
        // Add transform to handle undefined
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
});

export const Chat = mongoose.model('Chat', chatSchema);

// Add schema metadata for Firestore
Chat.schema = {
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

export const ChatDB = {
    async findByType(type) {
        console.log('Enter findByType with type:', type);
        try {
            console.log('Getting database engine...');
            const engine = db.getEngine();
            console.log('Database engine obtained');

            console.log('Calling find with type:', type);
            const messages = await engine.find(Chat, { type });
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
            const messages = await db.getEngine().find(Chat, { 
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

    async create(chatData) {
        console.log('Enter create with data:', chatData);
        try {
            // Remove gameId if it's a lobby message
            const data = chatData.type === 'lobby' 
                ? { ...chatData, gameId: undefined }
                : chatData;

            // Remove undefined fields before saving
            Object.keys(data).forEach(key => 
                data[key] === undefined && delete data[key]
            );

            return await db.getEngine().create(Chat, data);
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    },

    async delete(query) {
        console.log('Enter delete with query:', query);
        try {
            return await db.getEngine().delete(Chat, query);
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    },

    async deleteByGame(gameId) {
        console.log('Enter deleteByGame with gameId:', gameId);
        try {
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
            return await db.getEngine().update(Chat, query, data);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }
};