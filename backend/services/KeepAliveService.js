import SessionManager from './SessionManager.js';
import logger from '../utils/logger.js';

class KeepAliveService {
  /**
   * WebSocket Keep-Alive Service
   * 
   * CORE FUNCTIONALITY:
   * - Update session timestamp for a connected user
   * - Validate and maintain WebSocket session
   * - Lightweight, minimal overhead mechanism
   * 
   * USAGE:
   * - Called by WebSocket message handler
   * - Triggered on specific heartbeat messages
   * - Automatically updates user's session activity
   * 
   * @param {string} userUuid - User's unique identifier
   * @param {string} sessionToken - User's active session token
   * @returns {boolean} - Indicates if keep-alive was successful
   */
  static async updateSessionActivity(userUuid, sessionToken) {
    try {
      // Validate session
      const session = SessionManager.getSession(sessionToken);
      
      if (!session) {
        logger.warn(`Keep-alive failed: Invalid session for user ${userUuid}`);
        return false;
      }

      // Ensure session belongs to the correct user
      if (session.userUuid !== userUuid) {
        logger.warn(`Keep-alive rejected: Session user mismatch`);
        return false;
      }

      // Update user activity in SessionManager
      SessionManager.updateUserActivity(userUuid);

      // Session is valid, activity updated
      logger.debug(`Keep-alive successful for user ${userUuid}`);
      return true;

    } catch (error) {
      logger.error(`Keep-alive error for user ${userUuid}:`, error);
      return false;
    }
  }

  /**
   * Check if a user's session is still active
   * 
   * @param {string} userUuid - User's unique identifier
   * @returns {boolean} - Indicates if user's session is still active
   */
  static isSessionActive(userUuid) {
    return SessionManager.isUserOnline(userUuid);
  }

  /**
   * Get the current connection status for a user
   * 
   * @param {string} userUuid - User's unique identifier
   * @returns {string} - Connection status: 'online', 'offline', or 'uncertain'
   */
  static getConnectionStatus(userUuid) {
    return SessionManager.getConnectionStatus(userUuid);
  }
}

export default KeepAliveService;
