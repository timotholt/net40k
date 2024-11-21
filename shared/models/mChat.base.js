import { DateService } from '../../backend/services/DateService.js';
import { createMessageUuid } from '../../backend/constants/GameUuids.js';

export const MAX_MESSAGE_LENGTH = 2000;
export const MIN_MESSAGE_LENGTH = 1;

export class ChatBase {
    constructor(data = {}) {
        this.messageUuid = data.messageUuid || createMessageUuid();
        this.gameUuid = data.gameUuid;
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
            gameUuid: this.gameUuid,
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
        if (!this.messageUuid) {
            throw new Error('Message UUID is required');
        }
        if (!this.senderUuid) {
            throw new Error('Sender UUID is required');
        }
        if (!this.message || this.message.trim().length === 0) {
            throw new Error('Message cannot be empty');
        }
        if (!this.gameUuid) {
            throw new Error('Game UUID is required');
        }
        if (!this.senderNickname) {
            throw new Error('Sender nickname is required');
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