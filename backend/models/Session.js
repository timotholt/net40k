import { db } from '../database/database.js';
import { generateSchema } from '../utils/schemaGenerator.js';
import logger from '../utils/logger.js';
import DateService from '../services/DateService.js';

class Session {
    constructor(data = {}) {
        this.token = data.token || db.generateUuid();
        this.userUuid = data.userUuid;
        this.deviceInfo = data.deviceInfo || {};
        this.createdAt = data.createdAt || DateService.now().date;
        this.lastActive = data.lastActive || DateService.now().date;
    }

    static schema = generateSchema(new Session(), {
        token: { type: 'string', required: true, unique: true },
        userUuid: { type: 'string', required: true },
        deviceInfo: { 
            type: 'object', 
            properties: {
                deviceId: { type: 'string' },
                deviceName: { type: 'string' },
                deviceType: { type: 'string' },
                pushToken: { type: 'string' },
                ip: { type: 'string' },
                userAgent: { type: 'string' }
            }
        },
        createdAt: { type: 'date', required: true },
        lastActive: { type: 'date', required: true }
    });

    async touch() {
        this.lastActive = DateService.now().date;
        await SessionDB.update({ token: this.token }, { lastActive: this.lastActive });
    }
}

export const SessionDB = {
    collection: 'session',

    async init() {
        await db.createCollection(this.collection);
        await db.createIndex(this.collection, { token: 1 }, { unique: true });
        await db.createIndex(this.collection, { userUuid: 1 });
        await db.createIndex(this.collection, { createdAt: 1 }, { 
            expireAfterSeconds: 24 * 60 * 60 
        });
        logger.info('Session collection initialized');
    },

    async createSession(userUuid, deviceInfo = {}) {
        const session = new Session({ userUuid, deviceInfo });
        return await db.create(this.collection, session);
    },

    async findByToken(token) {
        const sessionData = await db.findOne(this.collection, { token });
        if (sessionData) {
            const session = new Session(sessionData);
            await session.touch();
            return session;
        }
        return null;
    },

    async terminateSession(token) {
        return await db.delete(this.collection, { token });
    },

    async terminateUserSessions(userUuid, exceptToken = null) {
        const query = { userUuid };
        if (exceptToken) {
            query.token = { $ne: exceptToken };
        }
        return await db.deleteMany(this.collection, query);
    },

    async getUserSessions(userUuid) {
        return await db.find(this.collection, 
            { userUuid }, 
            { sort: { lastActive: -1 } }
        );
    }
};

export default Session;
