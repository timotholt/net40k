import { userService } from './UserService.js';
import logger from '../utils/logger.js';
import { AuthError, ValidationError } from '../utils/errors.js';
import KeepAliveService from './KeepAliveService.js';

class UserWebSocketHandler {
    static wsConnections = new Map(); // userUuid -> WebSocket

    /**
     * Handle incoming WebSocket message
     * @param {WebSocket} ws
     * @param {Object} message
     */
    static async handleMessage(ws, message) {
        try {
            const { type, sessionToken, ...data } = message;

            // Validate session for all messages except login
            if (type !== 'client:auth:login') {
                const session = await userService.validateSession(sessionToken);
                data.userUuid = session.userUuid;
            }

            switch (type) {
                case 'client:auth:login':
                    await this.handleLogin(ws, data);
                    break;
                case 'client:auth:logout':
                    await this.handleLogout(ws, data);
                    break;
                case 'client:profile:update':
                    await this.handleProfileUpdate(ws, data);
                    break;
                case 'client:profile:get':
                    await this.handleGetProfile(ws, data);
                    break;
                case 'client:social:mute':
                    await this.handleMuteUser(ws, data);
                    break;
                case 'client:social:unmute':
                    await this.handleUnmuteUser(ws, data);
                    break;
                case 'client:social:block':
                    await this.handleBlockUser(ws, data);
                    break;
                case 'client:social:unblock':
                    await this.handleUnblockUser(ws, data);
                    break;
                case 'client:preferences:update':
                    await this.handleUpdatePreferences(ws, data);
                    break;
                case 'client:account:delete':
                    await this.handleDeleteAccount(ws, data);
                    break;
                case 'client:heartbeat':
                    await this.handleHeartbeat(ws, data);
                    break;
                default:
                    throw new ValidationError(`Unknown message type: ${type}`);
            }
        } catch (error) {
            logger.error('WebSocket message handling error:', error);
            ws.send(JSON.stringify({
                type: 'server:error',
                error: error.message
            }));
        }
    }

    /**
     * Handle WebSocket connection
     * @param {WebSocket} ws
     */
    static handleConnection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
    }

    /**
     * Handle WebSocket disconnection
     * @param {WebSocket} ws
     */
    static handleDisconnection(ws) {
        if (ws.userUuid) {
            this.wsConnections.delete(ws.userUuid);
        }
    }

    // Message handlers

    static async handleLogin(ws, { username, password }) {
        try {
            const result = await userService.login(username, password);
            ws.userUuid = result.user.userUuid;
            this.wsConnections.set(result.user.userUuid, ws);
            this.sendSuccess(ws, 'auth:login', result);
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleLogout(ws, { userUuid }) {
        try {
            await userService.logout(userUuid);
            this.wsConnections.delete(userUuid);
            this.sendSuccess(ws, 'auth:logout', { success: true });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleProfileUpdate(ws, { userUuid, ...updateData }) {
        try {
            const updatedUser = await userService.updateProfile(userUuid, updateData);
            this.sendSuccess(ws, 'profile:updated', { user: updatedUser });
            this.broadcastToUser(userUuid, 'profile:updated', { user: updatedUser });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleGetProfile(ws, { userUuid }) {
        try {
            const profile = await userService.getProfile(userUuid);
            this.sendSuccess(ws, 'profile:get', { profile });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleMuteUser(ws, { userUuid, targetUserUuid }) {
        try {
            await userService.muteUser(userUuid, targetUserUuid);
            const mutedList = await userService.getMutedUsers(userUuid);
            this.sendSuccess(ws, 'social:mute_updated', { mutedList });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleUnmuteUser(ws, { userUuid, targetUserUuid }) {
        try {
            await userService.unmuteUser(userUuid, targetUserUuid);
            const mutedList = await userService.getMutedUsers(userUuid);
            this.sendSuccess(ws, 'social:mute_updated', { mutedList });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleBlockUser(ws, { userUuid, targetUserUuid }) {
        try {
            await userService.blockUser(userUuid, targetUserUuid);
            const blockedList = await userService.getBlockedUsers(userUuid);
            this.sendSuccess(ws, 'social:block_updated', { blockedList });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleUnblockUser(ws, { userUuid, targetUserUuid }) {
        try {
            await userService.unblockUser(userUuid, targetUserUuid);
            const blockedList = await userService.getBlockedUsers(userUuid);
            this.sendSuccess(ws, 'social:block_updated', { blockedList });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleUpdatePreferences(ws, { userUuid, preferences }) {
        try {
            await userService.updatePreferences(userUuid, preferences);
            this.sendSuccess(ws, 'preferences:updated', { preferences });
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleDeleteAccount(ws, { userUuid }) {
        try {
            await userService.deleteAccount(userUuid);
            this.sendSuccess(ws, 'account:deleted', { success: true });
            this.wsConnections.delete(userUuid);
            ws.close();
        } catch (error) {
            this.sendError(ws, error.message);
        }
    }

    static async handleHeartbeat(ws, { timestamp, userUuid, sessionToken }) {
        const isSessionActive = await KeepAliveService.updateSessionActivity(userUuid, sessionToken);
        
        if (isSessionActive) {
            this.sendSuccess(ws, 'heartbeat', { 
                timestamp, 
                status: 'active' 
            });
        } else {
            this.sendError(ws, 'Session invalid or expired');
            ws.close();
        }
    }

    // Helper methods

    static sendSuccess(ws, type, data) {
        ws.send(JSON.stringify({
            type: `server:${type}`,
            success: true,
            ...data
        }));
    }

    static sendError(ws, message, code = 500) {
        ws.send(JSON.stringify({
            type: 'server:error',
            success: false,
            error: {
                code,
                message
            }
        }));
    }

    static handleError(ws, error) {
        let code = 500;
        if (error instanceof AuthError) code = 401;
        if (error instanceof ValidationError) code = 400;
        
        logger.error(`WebSocket error: ${error.message}`);
        this.sendError(ws, error.message, code);
    }

    static broadcastToUser(userUuid, type, data) {
        const ws = this.wsConnections.get(userUuid);
        if (ws) {
            this.sendSuccess(ws, type, data);
        }
    }

    static broadcastToAll(type, data, excludeUserUuid = null) {
        for (const [userUuid, ws] of this.wsConnections.entries()) {
            if (userUuid !== excludeUserUuid) {
                this.sendSuccess(ws, type, data);
            }
        }
    }

    /**
     * Start WebSocket heartbeat interval
     * @param {WebSocket.Server} wss
     */
    static startHeartbeat(wss) {
        setInterval(() => {
            wss.clients.forEach(ws => {
                if (ws.isAlive === false) {
                    this.handleDisconnection(ws);
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // Check every 30 seconds
    }
}

export default UserWebSocketHandler;
