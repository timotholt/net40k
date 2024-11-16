import { ChatBase } from './mChat.base.js';

export class ChatClient extends ChatBase {
    constructor(data = {}) {
        super(data);
    }

    // Add any client-specific methods here if needed
    // For now, we just inherit the base functionality
}