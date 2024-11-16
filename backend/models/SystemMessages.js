import { SYSTEM_USERS, SYSTEM_ROOMS } from '../constants/GameUuids.js';
import { UserDB } from './User.js';
import { chatService } from '../services/ChatService.js';
import { Lock } from './Lock.js';
import { GenerateSchema } from '../utils/schemaGenerator.js';

// System Users
const SYSTEM_USER_ID = SYSTEM_USERS.SYSTEM;
const SYSTEM_USERNAME = 'system';
const SYSTEM_NICKNAME = '<s>';

const GAMEMASTER_USER_ID = SYSTEM_USERS.GM;
const GAMEMASTER_USERNAME = 'gamemaster';
const GAMEMASTER_NICKNAME = '<Game Master>';

const NEWS_USER_ID = SYSTEM_USERS.NEWS;
const NEWS_USERNAME = 'news';
const NEWS_NICKNAME = '<News>';

// System Rooms
const SYSTEM_ROOM_ID = SYSTEM_ROOMS.SYSTEM;
const LOBBY_ROOM_ID = SYSTEM_ROOMS.LOBBY;
const NEWS_ROOM_ID = SYSTEM_ROOMS.NEWS;
const GAMEMASTER_ROOM_ID = SYSTEM_ROOMS.GAMEMASTER;

const ReservedUsers = [
    { userId: SYSTEM_USER_ID, username: SYSTEM_USERNAME, nickname: SYSTEM_NICKNAME },
    { userId: GAMEMASTER_USER_ID, username: GAMEMASTER_USERNAME, nickname: GAMEMASTER_NICKNAME },
    { userId: NEWS_USER_ID, username: NEWS_USERNAME, nickname: NEWS_NICKNAME }
];

@GenerateSchema({
    userId: { type: 'string', required: true },
    username: { type: 'string', required: true },
    nickname: { type: 'string', required: true }
})
class SystemUser {
    constructor(data) {
        this.userId = data.userId;
        this.username = data.username;
        this.nickname = data.nickname;
        this.validate();
    }

    validate() {
        if (!this.userId || typeof this.userId !== 'string') {
            throw new Error('Invalid userId');
        }
        if (!this.username || typeof this.username !== 'string') {
            throw new Error('Invalid username');
        }
        if (!this.nickname || typeof this.nickname !== 'string') {
            throw new Error('Invalid nickname');
        }
    }
}

export class SystemMessages {
    static async initialize() {
        const releaseLock = await Lock.acquire('system:initialize');
        try {
            // Check if system users exist
            const systemUser = await UserDB.findOne({ userId: SYSTEM_USER_ID });
            if (!systemUser) {
                console.log('Creating system users...');

                // Create the reserved users
                for (const userData of ReservedUsers) {
                    const user = new SystemUser(userData);
                    await UserDB.create({
                        _id: user.userId,
                        userId: user.userId,
                        username: user.username,
                        nickname: user.nickname,
                        // System users don't need passwords as they can't be logged into
                        isSystemUser: true
                    });
                }
            }
        } catch (error) {
            console.error('Failed to initialize system users:', error);
            throw error;
        } finally {
            releaseLock();
        }
    }

    static validateGameId(gameId) {
        if (!gameId || typeof gameId !== 'string') {
            throw new Error('Invalid gameId');
        }
    }

    static validateNickname(nickname) {
        if (!nickname || typeof nickname !== 'string') {
            throw new Error('Invalid nickname');
        }
    }

    static validateMessage(message) {
        if (!message || typeof message !== 'string') {
            throw new Error('Invalid message');
        }
    }

    static async broadcastToLobby(message) {
        this.validateMessage(message);
        try {
            return await chatService.createMessage(
                'lobby',
                SYSTEM_USER_ID,
                message
            );
        } catch (error) {
            console.error('Failed to broadcast to lobby:', error);
            throw error;
        }
    }

    static async broadcastToGame(gameId, message) {
        this.validateGameId(gameId);
        this.validateMessage(message);
        try {
            return await chatService.createMessage(
                'game',
                SYSTEM_USER_ID,
                message,
                gameId
            );
        } catch (error) {
            console.error('Failed to broadcast to game:', error);
            throw error;
        }
    }

    // Pre-defined message helpers
    static async userJoined(gameId, nickname) {
        this.validateGameId(gameId);
        this.validateNickname(nickname);
        return this.broadcastToGame(gameId, `${nickname} joined the game`);
    }

    static async userLeft(gameId, nickname) {
        this.validateGameId(gameId);
        this.validateNickname(nickname);
        return this.broadcastToGame(gameId, `${nickname} left the game`);
    }

    static async userLoggedIn(nickname) {
        this.validateNickname(nickname);
        return this.broadcastToLobby(`${nickname} logged in`);
    }

    static async userLoggedOut(nickname) {
        this.validateNickname(nickname);
        return this.broadcastToLobby(`${nickname} logged out`);
    }

    static async serverShutdown(minutes) {
        if (typeof minutes !== 'number' || minutes < 0) {
            throw new Error('Invalid minutes value');
        }
        return this.broadcastToLobby(`⚠️ Server shutting down in ${minutes} minutes`);
    }

    static async serverMaintenance(message) {
        this.validateMessage(message);
        return this.broadcastToLobby(`🔧 ${message}`);
    }

    static async gameCreated(gameName, creatorNickname) {
        this.validateMessage(gameName);
        this.validateNickname(creatorNickname);
        return this.broadcastToLobby(`${creatorNickname} created game "${gameName}"`);
    }

    static async gameDeleted(gameName, creatorNickname) {
        this.validateMessage(gameName);
        this.validateNickname(creatorNickname);
        return this.broadcastToLobby(`${creatorNickname} deleted game "${gameName}"`);
    }

    static async userDeleted(nickname) {
        this.validateNickname(nickname);
        return this.broadcastToLobby(`${nickname} deleted their account`);
    }

    static async nicknameChanged(oldNickname, newNickname) {
        this.validateNickname(oldNickname);
        this.validateNickname(newNickname);
        return this.broadcastToLobby(`${oldNickname} changed their nickname to ${newNickname}`);
    }

    static async serverStarted() {
        return this.broadcastToLobby(`🟢 Server started`);
    }

    static async serverStopping() {
        return this.broadcastToLobby(`🔴 Server stopping...`);
    }

    static async kickedFromGame(gameId, nickname, reason) {
        this.validateGameId(gameId);
        this.validateNickname(nickname);
        if (reason) this.validateMessage(reason);
        return this.broadcastToGame(gameId, `${nickname} was kicked from the game${reason ? `: ${reason}` : ''}`);
    }

    static async gameStarted(gameId) {
        this.validateGameId(gameId);
        return this.broadcastToGame(gameId, `🎮 Game started!`);
    }

    static async gameEnded(gameId) {
        this.validateGameId(gameId);
        return this.broadcastToGame(gameId, `🏁 Game ended`);
    }

    static async systemError(message) {
        this.validateMessage(message);
        return this.broadcastToLobby(`❌ System Error: ${message}`);
    }

    static async systemWarning(message) {
        this.validateMessage(message);
        return this.broadcastToLobby(`⚠️ Warning: ${message}`);
    }

    static async systemInfo(message) {
        this.validateMessage(message);
        return this.broadcastToLobby(`ℹ️ ${message}`);
    }
}
