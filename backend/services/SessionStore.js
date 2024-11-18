import { Store } from 'express-session';
import { db } from '../database/database.js';

export class DatabaseSessionStore extends Store {
    constructor(options = {}) {
        super(options);
        this.ttl = options.ttl || 24 * 60 * 60; // 24 hours in seconds
    }

    async get(sid, callback) {
        try {
            const session = await db.findOne('sessions', { sid });
            if (!session) {
                return callback();
            }
            
            // Check if session is expired
            if (session.expires && session.expires <= Date.now()) {
                await this.destroy(sid);
                return callback();
            }

            callback(null, session.data);
        } catch (err) {
            callback(err);
        }
    }

    async set(sid, session, callback) {
        try {
            const expires = new Date(Date.now() + (this.ttl * 1000));
            
            await db.upsert('sessions', 
                { sid },
                { 
                    sid,
                    data: session,
                    expires
                }
            );
            callback();
        } catch (err) {
            callback(err);
        }
    }

    async destroy(sid, callback) {
        try {
            await db.delete('sessions', { sid });
            callback();
        } catch (err) {
            callback(err);
        }
    }

    async touch(sid, session, callback) {
        try {
            const expires = new Date(Date.now() + (this.ttl * 1000));
            await db.update('sessions', 
                { sid },
                { expires }
            );
            callback();
        } catch (err) {
            callback(err);
        }
    }

    async clear(callback) {
        try {
            await db.deleteMany('sessions', {});
            callback();
        } catch (err) {
            callback(err);
        }
    }
}
