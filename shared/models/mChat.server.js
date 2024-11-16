import { db } from '../../backend/database/database.js';
import { ChatBase } from './mChat.base.js';

export class ChatServer extends ChatBase {
    constructor(data = {}) {
        super(data);
    }

    static async findByGame(gameId) {
        const model = await ChatDB.init();
        return model.find({ gameId });
    }

    static async findOne(query) {
        const model = await ChatDB.init();
        return model.findOne(query);
    }

    async save() {
        this.validate();
        const model = await ChatDB.init();
        return model.create(this.toJSON());
    }

    async update(data) {
        const model = await ChatDB.init();
        return model.update({ messageUuid: this.messageUuid }, data);
    }
}

export const ChatDB = {
    _model: null,

    async init() {
        if (!this._model) {
            this._model = await db.createModel('chats');
        }
        return this._model;
    }
};