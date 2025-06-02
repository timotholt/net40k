import { userCreate, userValidateBase } from './mUser.base.js';
import DateService from '../../backend/services/DateService.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * @typedef {import('./mUser.base.js').UserBase} UserBase
 */

/**
 * @typedef {Object} Session
 * @property {WebSocket} socket
 * @property {Date} createdAt
 * @property {Date} lastActive
 */

/**
 * @typedef {Object} ServerUser
 * @property {string} username - User's login name
 * @property {string} verifiedEmail
 * @property {string} unverifiedEmail
 * @property {string} verificationToken
 * @property {Date} verificationExpiresAt
 * @property {string} password
 * @property {Date} lastLoginAt
 * @property {boolean} isDeleted
 * @property {boolean} isBanned
 * @property {string} banReason
 * @property {Date} banExpiresAt
 * @property {boolean} isVerified
 * @property {Set<string>} games
 * @property {Set<string>} activeGames
 * @property {Map<string, Session>} sessions
 * @property {Set<string>} mutedUsers - Set of userUuids that this user has muted
 * @property {Set<string>} blockedUsers - Set of userUuids that this user has blocked
 */

/**
 * @typedef {UserBase & ServerUser} User
 */

/**
 * Creates a new server-side user
 * @param {Partial<User>} data 
 * @returns {User}
 */
export function userCreateServer(data = {}) {
    return {
        ...userCreate(data),
        username: data.username,
        verifiedEmail: data.verifiedEmail,
        unverifiedEmail: data.unverifiedEmail,
        verificationToken: data.verificationToken,
        verificationExpiresAt: data.verificationExpiresAt,
        verifiedAt: data.verifiedAt,
        password: data.password,
        lastLoginAt: data.lastLoginAt || null,
        isDeleted: data.isDeleted || false,
        isBanned: data.isBanned || false,
        banReason: data.banReason || '',
        banExpiresAt: data.banExpiresAt || null,
        isVerified: data.isVerified || false,
        games: new Set(data.games || []),
        activeGames: new Set(data.activeGames || []),
        sessions: new Map(),
        mutedUsers: new Set(data.mutedUsers || []),
        blockedUsers: new Set(data.blockedUsers || [])
    };
}

/**
 * Set user's password
 * @param {User} user 
 * @param {string} password 
 */
export async function userSetPassword(user, password) {
    user.password = await bcrypt.hash(password, 10);
}

/**
 * Verify user's password
 * @param {User} user 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
export async function userVerifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
}

/**
 * Generate email verification token
 * @param {User} user 
 * @returns {string} verification token
 */
export function userGenerateVerificationToken(user) {
    user.verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return user.verificationToken;
}

/**
 * Verify user's email
 * @param {User} user 
 * @returns {boolean}
 */
export function userVerifyEmail(user) {
    let d = new Date();
    if (user.verificationToken && user.verificationExpiresAt > d) {
        user.isVerified = true;
        user.verifiedEmail = user.unverifiedEmail;
        user.unverifiedEmail = null;
        user.verificationToken = null;
        user.verificationExpiresAt = null;
        user.verifiedAt = d;
        return true;
    }
    return false;
}

/**
 * Ban a user
 * @param {User} user 
 * @param {string} reason 
 * @param {number} duration - Duration in milliseconds
 */
export function userBan(user, reason, duration = 24 * 60 * 60 * 1000) {
    user.isBanned = true;
    user.banReason = reason;
    user.banExpiresAt = new Date(Date.now() + duration);
}

/**
 * Unban a user
 * @param {User} user 
 */
export function userUnban(user) {
    user.isBanned = false;
    user.banReason = null;
    user.banExpiresAt = null;
}

/**
 * Add a session for the user
 * @param {User} user 
 * @param {string} sessionId 
 * @param {WebSocket} socket 
 */
export function userAddSession(user, sessionId, socket) {
    user.sessions.set(sessionId, {
        socket,
        createdAt: DateService.now(),
        lastActive: DateService.now()
    });
    user.status = 'online';
    user.lastLoginAt = DateService.now();
}

/**
 * Remove a session
 * @param {User} user 
 * @param {string} sessionId 
 */
export function userRemoveSession(user, sessionId) {
    const session = user.sessions.get(sessionId);
    if (session) {
        user.sessions.delete(sessionId);
        if (user.sessions.size === 0) {
            user.status = 'offline';
        }
    }
}

/**
 * Join a game
 * @param {User} user 
 * @param {string} gameUuid 
 */
export function userJoinRoom(user, gameUuid) {
    if (!user.games.has(gameUuid)) {
        user.games.add(gameUuid);
        userBroadcastToSessions(user, 'game_joined', { gameUuid });
    }
}

/**
 * Leave a game
 * @param {User} user 
 * @param {string} gameUuid 
 */
export function userLeaveRoom(user, gameUuid) {
    if (user.games.has(gameUuid)) {
        user.games.delete(gameUuid);
        userBroadcastToSessions(user, 'game_left', { gameUuid });
    }
}

/**
 * Mute a user
 * @param {User} user - The user doing the muting
 * @param {string} targetUserUuid - The uuid of the user to mute
 * @returns {boolean} - True if the user was muted, false if they were already muted
 */
export function userMuteUser(user, targetUserUuid) {
    if (user.mutedUsers.has(targetUserUuid)) {
        return false;
    }
    user.mutedUsers.add(targetUserUuid);
    return true;
}

/**
 * Unmute a user
 * @param {User} user - The user doing the unmuting
 * @param {string} targetUserUuid - The uuid of the user to unmute
 * @returns {boolean} - True if the user was unmuted, false if they weren't muted
 */
export function userUnmuteUser(user, targetUserUuid) {
    return user.mutedUsers.delete(targetUserUuid);
}

/**
 * Block a user
 * @param {User} user - The user doing the blocking
 * @param {string} targetUserUuid - The uuid of the user to block
 * @returns {boolean} - True if the user was blocked, false if they were already blocked
 */
export function userBlockUser(user, targetUserUuid) {
    if (user.blockedUsers.has(targetUserUuid)) {
        return false;
    }
    user.blockedUsers.add(targetUserUuid);
    // Also mute the blocked user
    user.mutedUsers.add(targetUserUuid);
    return true;
}

/**
 * Unblock a user
 * @param {User} user - The user doing the unblocking
 * @param {string} targetUserUuid - The uuid of the user to unblock
 * @returns {boolean} - True if the user was unblocked, false if they weren't blocked
 */
export function userUnblockUser(user, targetUserUuid) {
    return user.blockedUsers.delete(targetUserUuid);
    // Note: We don't automatically unmute when unblocking
}

/**
 * Check if a user is muted
 * @param {User} user - The user to check
 * @param {string} targetUserUuid - The uuid of the potentially muted user
 * @returns {boolean}
 */
export function userIsMuted(user, targetUserUuid) {
    return user.mutedUsers.has(targetUserUuid);
}

/**
 * Check if a user is blocked
 * @param {User} user - The user to check
 * @param {string} targetUserUuid - The uuid of the potentially blocked user
 * @returns {boolean}
 */
export function userIsBlocked(user, targetUserUuid) {
    return user.blockedUsers.has(targetUserUuid);
}

/**
 * Convert user to JSON for network transmission
 * @param {User} user 
 * @returns {Object}
 */
export function userToJSONServer(user) {
    return {
        ...user,
        games: Array.from(user.games),
        activeGames: Array.from(user.activeGames),
        mutedUsers: Array.from(user.mutedUsers),
        blockedUsers: Array.from(user.blockedUsers),
        sessionCount: user.sessions.size
    };
}

/**
 * Convert user to database format
 * @param {User} user 
 * @returns {Object}
 */
export function userToDatabase(user) {
    return {
        ...userToJSONServer(user),
        sessions: Array.from(user.sessions.entries()),
        updatedAt: DateService.now(),
        schemaVersion: 1
    };
}

/**
 * Broadcast a message to all user sessions
 * @param {User} user 
 * @param {string} type 
 * @param {Object} data 
 */
export function userBroadcastToSessions(user, type, data = {}) {
    const message = JSON.stringify({
        type,
        userUuid: user.userUuid,
        ...data
    });

    user.sessions.forEach(session => {
        try {
            session.socket.send(message);
        } catch (error) {
            console.error(`Failed to send message to session: ${error}`);
        }
    });
}

/**
 * Validate server-side user data
 * @param {User} user 
 * @throws {Error} If validation fails
 */
export function userValidateServer(user) {
    userValidateBase(user);
    
    if (!user.username) {
        throw new Error('Username is required');
    }
    if (user.unverifiedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.unverifiedEmail)) {
        throw new Error('Invalid unverified email format');
    }
    if (user.verifiedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.verifiedEmail)) {
        throw new Error('Invalid verified email format');
    }
    if (!user.password) {
        throw new Error('Password is required');
    }
}