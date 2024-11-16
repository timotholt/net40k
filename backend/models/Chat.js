import { db } from '../database/database.js';
import { UuidService } from '../services/UuidService.js';
import DateService from '../services/DateService.js';
import { createMessageUuid } from '../constants/GameUuids.js';

class Chat {
    constructor(data = {}) {
        this.messageUuid = data.messageUuid || createMessageUuid();
        this.roomUuid = data.roomUuid;
        this.senderUuid = data.senderUuid;
        this.gameUuid = data.gameUuid;
        this.senderNickname = data.senderNickname;
        this.message = data.message;
        this.createdAt = data.createdAt || DateService.now();
        this.isWhisper = data.isWhisper || false;
        this.recipientId = data.isWhisper ? data.recipientId : null;
        this.metadata = this.processMetadata(data.metadata || {});
    }

    processMetadata(metadata) {
        // If there's a URL in metadata, validate and process it
        if (metadata.url) {
            const isInternalUrl = metadata.url.startsWith('i:');
            return {
                ...metadata,
                url: metadata.url,
                title: metadata.title || '',
                description: metadata.description || '',
                isInternalUrl
            };
        }
        return metadata;
    }

    toJSON() {
        const data = {
            messageUuid: this.messageUuid,
            roomUuid: this.roomUuid,
            senderUuid: this.senderUuid,
            gameUuid: this.gameUuid,
            senderNickname: this.senderNickname,
            message: this.message,
            createdAt: this.createdAt,
            isWhisper: this.isWhisper,
            recipientId: this.recipientId,
            metadata: this.metadata
        };

        // Remove undefined values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                data[key] = null;
            }
        });

        return data;
    }

    validate() {
        // Required fields validation
        if (!this.messageUuid) {
            throw new Error('Message UUID is required');
        }
        if (!this.senderUuid) {
            throw new Error('Sender UUID is required');
        }
        if (!this.message || this.message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        if (!this.roomUuid) {
            throw new Error('Room UUID is required');
        }
        if (!this.senderNickname) {
            throw new Error('Sender nickname is required');
        }

        // Conditional and format validations
        if (this.gameUuid && !UuidService.isValid(this.gameUuid)) {
            throw new Error('Invalid game UUID');
        }
        if (this.isWhisper && !this.recipientId) {
            throw new Error('Recipient ID is required for whisper messages');
        }
        if (this.metadata?.url && typeof this.metadata.url !== 'string') {
            throw new Error('URL must be a string');
        }

        return true;
    }
}

export const ChatDB = {
    _model: null,

    async init() {
        if (!this._model) {
            this._model = await db.createModel('chats');
        }
        return this._model;
    },

    async findByType(type) {
        const model = await this.init();
        const messages = await db.getEngine().find(model, { type });
        const sortedMessages = messages
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-100)
            .map(msg => new Chat(msg));
        
        return sortedMessages;
    },

    async findByGame(gameId) {
        const model = await this.init();
        const messages = await db.getEngine().find(model, { 
            gameUuid: gameId 
        });
        const sortedMessages = messages
            .sort((a, b) => a.createdAt - b.createdAt)
            .slice(-100)
            .map(msg => new Chat(msg));
        
        return sortedMessages;
    },

    async findOne(query) {
        const model = await this.init();
        const message = await db.getEngine().findOne(model, query);
        return message ? new Chat(message) : null;
    },

    async create(chatData) {
        const model = await this.init();
        const chat = new Chat(chatData);
        chat.validate();

        // Prepare data for database
        const dbData = chat.toJSON();

        // Remove undefined fields
        Object.keys(dbData).forEach(key => 
            dbData[key] === undefined && delete dbData[key]
        );

        const result = await db.getEngine().create(model, dbData);
        return new Chat(result);
    },

    async update(query, data) {
        const model = await this.init();
        return await db.getEngine().update(model, query, data);
    }
};