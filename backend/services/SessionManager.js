import { UuidService } from './UuidService.js';

class SessionManager {
    static sessions = new Map();
    static cleanupInterval = 60 * 60 * 1000; // 1 hour
    static sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    static ONLINE_THRESHOLD = 1 * 60 * 1000; // 5 minutes - time before user is considered offline

    static {
        // Display startup message
        console.log(`SessionManager.js initialized with cleanup interval of ${this.cleanupInterval} ms and session timeout of ${this.sessionTimeout} ms`);

        // Start cleanup interval when module is loaded
        setInterval(() => this.cleanup(), this.cleanupInterval);
    }

    static createSession(userUuid) {
        // Remove any existing sessions for this user
        for (const [existingToken, session] of this.sessions.entries()) {
            if (session.userUuid === userUuid) {
                this.sessions.delete(existingToken);
            }
        }
        
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

    static isUserOnline(userUuid) {
        const now = Date.now();
        for (const session of this.sessions.values()) {
            if (session.userUuid === userUuid && 
                (now - session.lastActive) < this.ONLINE_THRESHOLD) {
                return true;
            }
        }
        return false;
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
