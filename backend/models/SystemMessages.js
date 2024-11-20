import { SYSTEM_USERS, SYSTEM_ROOMS } from '@net40k/shared';
import { UserDB } from './User.js';
import { chatService } from '../services/ChatService.js';
import { Lock } from './Lock.js';

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

export const SystemMessages = {
    async initialize() {
        const releaseLock = await Lock.acquire('system:initialize');
        try {
            // Check if system users exist
            const systemUser = await UserDB.findOne({ userUuid: SYSTEM_USER_ID });
            if (!systemUser) {
                await UserDB.create({
                    userUuid: SYSTEM_USER_ID,
                    username: SYSTEM_USERNAME,
                    nickname: SYSTEM_NICKNAME
                });
            }

            const gmUser = await UserDB.findOne({ userUuid: GAMEMASTER_USER_ID });
            if (!gmUser) {
                await UserDB.create({
                    userUuid: GAMEMASTER_USER_ID,
                    username: GAMEMASTER_USERNAME,
                    nickname: GAMEMASTER_NICKNAME
                });
            }

            const newsUser = await UserDB.findOne({ userUuid: NEWS_USER_ID });
            if (!newsUser) {
                await UserDB.create({
                    userUuid: NEWS_USER_ID,
                    username: NEWS_USERNAME,
                    nickname: NEWS_NICKNAME
                });
            }
        } catch (error) {
            console.error('Failed to initialize system users:', error);
            throw error;
        } finally {
            releaseLock();
        }
    },

    async _sendToLobby(message) {
        return chatService.createMessage(LOBBY_ROOM_ID, SYSTEM_USER_ID, message);
    },

    async _sendToGame(gameUuid, message) {
        return chatService.createMessage(gameUuid, SYSTEM_USER_ID, message);
    },

    // Game events
    async userJoined(gameUuid, nickname) {
        return this._sendToGame(gameUuid, `${nickname} joined the game`);
    },

    async userLeft(gameUuid, nickname) {
        return this._sendToGame(gameUuid, `${nickname} left the game`);
    },

    async gameStarted(gameUuid) {
        return this._sendToGame(gameUuid, `🎮 Game started!`);
    },

    async gameEnded(gameUuid) {
        return this._sendToGame(gameUuid, `🏁 Game ended`);
    },

    async kickedFromGame(gameUuid, nickname, reason) {
        return this._sendToGame(gameUuid, `${nickname} was kicked from the game${reason ? `: ${reason}` : ''}`);
    },

    // Lobby events
    async userLoggedIn(nickname) {
        return this._sendToLobby(`${nickname} logged in`);
    },

    async userLoggedOut(nickname) {
        return this._sendToLobby(`${nickname} logged out`);
    },

    async gameCreated(gameName, creatorNickname) {
        return this._sendToLobby(`${creatorNickname} created game "${gameName}"`);
    },

    async gameDeleted(gameName, creatorNickname) {
        return this._sendToLobby(`${creatorNickname} deleted game "${gameName}"`);
    },

    async userDeleted(nickname) {
        return this._sendToLobby(`${nickname} deleted their account`);
    },

    async nicknameChanged(oldNickname, newNickname) {
        return this._sendToLobby(`${oldNickname} changed their nickname to ${newNickname}`);
    },

    // Server events
    async serverStarted() {
        return this._sendToLobby(`🟢 Server started`);
    },

    async serverStopping() {
        return this._sendToLobby(`🔴 Server stopping...`);
    },

    async serverShutdown(minutes) {
        return this._sendToLobby(`⚠️ Server shutting down in ${minutes} minutes`);
    },

    async serverMaintenance(message) {
        return this._sendToLobby(`🔧 ${message}`);
    },

    // System notifications
    async systemError(message) {
        return this._sendToLobby(`❌ System Error: ${message}`);
    },

    async systemWarning(message) {
        return this._sendToLobby(`⚠️ Warning: ${message}`);
    },

    async systemInfo(message) {
        return this._sendToLobby(`ℹ️ ${message}`);
    }
};
