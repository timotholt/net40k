import { UuidService } from './UuidService.js';

class SessionManager {
    static sessions = new Map();
    static cleanupInterval = 60 * 60 * 1000; // 1 hour
    static sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours

    static {
        // Start cleanup interval when module is loaded
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    static createSession(userUuid) {
        // Remove any existing sessions for this user
        this.removeUserSessions(userUuid);
        
        const token = UuidService.generate();
        const session = {
            token,
            userUuid,
            createdAt: Date.now(),
            lastActive: Date.now()
        };

        this.sessions.set(token, session);
        return token;
    }

    static getSession(token) {
        const session = this.sessions.get(token);
        if (session) {
            session.lastActive = Date.now();
            this.sessions.set(token, session);
        }
        return session;
    }

    static removeSession(token) {
        return this.sessions.delete(token);
    }

    static removeUserSessions(userUuid) {
        for (const [token, session] of this.sessions.entries()) {
            if (session.userUuid === userUuid) {
                this.sessions.delete(token);
            }
        }
    }

    static cleanup() {
        const now = Date.now();
        for (const [token, session] of this.sessions.entries()) {
            if (now - session.lastActive > this.sessionTimeout) {
                this.sessions.delete(token);
            }
        }
    }
}

export default SessionManager;
