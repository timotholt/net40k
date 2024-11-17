import { createUserUuid } from '../../backend/constants/GameUuids.js';

/**
 * @typedef {Object} UserBase
 * @property {string} userUuid - Unique identifier for the user
 * @property {string} nickname - User's display name
 * @property {string} status - User's online status ('online', 'offline', etc.)
 */

/**
 * Creates a new UserBase object with only public fields
 * @param {Partial<UserBase>} data - Initial data
 * @returns {UserBase}
 */
export function userCreate(data = {}) {
    return {
        userUuid: data.userUuid || createUserUuid(),
        nickname: data.nickname || '',
        status: data.status || 'offline'
    };
}

/**
 * Validates a UserBase object
 * @param {UserBase} user 
 * @throws {Error} If validation fails
 */
export function userValidateBase(user) {
    if (!user.userUuid) {
        throw new Error('UserUuid is required');
    }
    if (!user.nickname) {
        throw new Error('Nickname is required');
    }
}

/**
 * Converts UserBase to a plain object for network transmission
 * @param {UserBase} user 
 * @returns {Object}
 */
export function userToJSON(user) {
    const data = {
        userUuid: user.userUuid,
        nickname: user.nickname,
        status: user.status
    };

    // Remove undefined values
    Object.keys(data).forEach(key => {
        if (data[key] === undefined) {
            data[key] = null;
        }
    });

    return data;
}

/**
 * Checks if the user is online
 * @param {UserBase} user 
 * @returns {boolean}
 */
export function userIsOnline(user) {
    return user.status === 'online';
}

/**
 * Sets the user's status
 * @param {UserBase} user 
 * @param {string} status 
 * @throws {Error} If status is invalid
 */
export function userSetStatus(user, status) {
    const validStatuses = ['online', 'offline', 'away', 'busy'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
    }
    user.status = status;
}