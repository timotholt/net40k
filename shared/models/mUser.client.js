import { userCreate } from './mUser.base.js';

/**
 * @typedef {import('./mUser.base.js').UserBase} UserBase
 */

/**
 * @typedef {Object} ClientUser
 * @property {WebSocket} socket - Client's WebSocket connection
 * @property {Set<string>} mutedUsers - Set of userUuids that this user has muted
 * @property {Set<string>} blockedUsers - Set of userUuids that this user has blocked
 */

/**
 * @typedef {UserBase & ClientUser} User
 */

/**
 * Creates a new client-side user
 * @param {Partial<User>} data 
 * @returns {User}
 */
export function userCreateClient(data = {}) {
    return {
        ...userCreate(data),
        socket: data.socket,
        mutedUsers: new Set(data.mutedUsers || []),
        blockedUsers: new Set(data.blockedUsers || [])
    };
}

/**
 * Send a message to the server
 * @param {User} user 
 * @param {string} type 
 * @param {Object} data 
 */
export function userSendToServer(user, type, data = {}) {
    if (!user.socket) return;

    const message = JSON.stringify({
        type,
        userUuid: user.userUuid,
        ...data
    });

    user.socket.send(message);
}

/**
 * Mute a user and notify the server
 * @param {User} user - The user doing the muting
 * @param {string} targetUserUuid - The uuid of the user to mute
 */
export function userMuteUser(user, targetUserUuid) {
    user.mutedUsers.add(targetUserUuid);
    userSendToServer(user, 'user:mute', { targetUserUuid });
}

/**
 * Unmute a user and notify the server
 * @param {User} user - The user doing the unmuting
 * @param {string} targetUserUuid - The uuid of the user to unmute
 */
export function userUnmuteUser(user, targetUserUuid) {
    user.mutedUsers.delete(targetUserUuid);
    userSendToServer(user, 'user:unmute', { targetUserUuid });
}

/**
 * Block a user and notify the server
 * @param {User} user - The user doing the blocking
 * @param {string} targetUserUuid - The uuid of the user to block
 */
export function userBlockUser(user, targetUserUuid) {
    user.blockedUsers.add(targetUserUuid);
    user.mutedUsers.add(targetUserUuid); // Blocked users are automatically muted
    userSendToServer(user, 'user:block', { targetUserUuid });
}

/**
 * Unblock a user and notify the server
 * @param {User} user - The user doing the unblocking
 * @param {string} targetUserUuid - The uuid of the user to unblock
 */
export function userUnblockUser(user, targetUserUuid) {
    user.blockedUsers.delete(targetUserUuid);
    userSendToServer(user, 'user:unblock', { targetUserUuid });
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
 * Get list of muted users
 * @param {User} user
 * @returns {string[]}
 */
export function userGetMutedUsers(user) {
    return Array.from(user.mutedUsers);
}

/**
 * Get list of blocked users
 * @param {User} user
 * @returns {string[]}
 */
export function userGetBlockedUsers(user) {
    return Array.from(user.blockedUsers);
}