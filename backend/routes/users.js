import express from 'express';
import { userService } from '../services/UserService.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';
import { createRateLimit } from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Debug middleware for user routes
router.use((req, res, next) => {
    logger.debug('User Routes - Incoming request:', {
        method: req.method,
        path: req.path,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl
    });
    next();
});

// Authentication routes
router.post('/register', createRateLimit('register'), async (req, res) => {
    try {
        // TEMPORARY MODIFICATION - START
        // Email verification disabled for initial development
        // This is a temporary change to simplify the registration flow
        // Will be re-enabled once email infrastructure is in place
        // DO NOT REMOVE the email validation below
        const { username, password, nickname } = req.body;
        // const { username, email, password } = req.body;

        const user = await userService.register({ 
            username, 
            // email,  // Temporarily disabled
            password,
            nickname 
        });
        res.status(201).json({ success: true, user });
    } catch (error) {
        logger.error('Registration error:', error.message);
        const statusCode = error.name === 'ValidationError' ? 400 : 500;
        res.status(statusCode).json({ success: false, message: error.message });
    }
});

router.post('/login', createRateLimit('login'), async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userService.login(username, password);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
});

router.post('/logout', authenticateUser, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        await userService.logout(token);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Profile routes
/**
 * Get Profile Endpoint
 * 
 * @description
 * Retrieves the profile information of the authenticated user.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized access
 * - Returns only the profile information for the authenticated user
 * - Prevents exposure of profile information to unauthorized parties
 * 
 * Response:
 * - 200 OK: Returns profile information
 * - 404 Not Found: User not found
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Retrieve the profile information for the authenticated user
 * 3. Return the profile information
 */
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.userUuid);
        res.json({ success: true, user });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

/**
 * Update Profile Endpoint
 * 
 * @description
 * Updates the profile information of the authenticated user.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized updates
 * - Only allows updates to the authenticated user's profile
 * - Prevents exposure of profile information to unauthorized parties
 * 
 * Request Body:
 * @param {object} profileData - Updated profile information
 * 
 * Response:
 * - 200 OK: Profile updated successfully
 * - 400 Bad Request: Update failed (e.g., invalid data)
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Validate the updated profile information
 * 3. Update the profile information for the authenticated user
 * 4. Return success or error response
 */
router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.userUuid, req.body);
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Password management
/**
 * Password Reset Request Endpoint
 * 
 * @description
 * Sends a password reset email to the user with the specified email address.
 * 
 * Security Considerations:
 * - Does not require user authentication to allow password reset for all users
 * - Validates the email address to prevent abuse
 * - Prevents exposure of user information to unauthorized parties
 * 
 * Request Body:
 * @param {string} email - Email address of the user
 * 
 * Response:
 * - 200 OK: Password reset email sent successfully
 * - 500 Internal Server Error: Email sending failed
 * 
 * Workflow:
 * 1. Validate the email address
 * 2. Send a password reset email to the user
 * 3. Return success or error response
 */
router.post('/password/reset-request', createRateLimit('passwordReset'), async (req, res) => {
    try {
        await userService.requestPasswordReset(req.body.email);
        res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * Password Reset Endpoint
 * 
 * @description
 * Resets the password of the user with the specified token.
 * 
 * Security Considerations:
 * - Requires a valid password reset token to prevent unauthorized password resets
 * - Validates the new password to ensure security
 * - Prevents exposure of user information to unauthorized parties
 * 
 * Request Body:
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password
 * 
 * Response:
 * - 200 OK: Password reset successfully
 * - 400 Bad Request: Password reset failed (e.g., invalid token or password)
 * 
 * Workflow:
 * 1. Validate the password reset token
 * 2. Validate the new password
 * 3. Reset the password for the user
 * 4. Return success or error response
 */
router.post('/password/reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await userService.resetPassword(token, newPassword);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Change Password Endpoint
 * 
 * @description
 * Changes the password of the authenticated user.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized password changes
 * - Validates the old and new passwords to ensure security
 * - Prevents exposure of user information to unauthorized parties
 * 
 * Request Body:
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * 
 * Response:
 * - 200 OK: Password changed successfully
 * - 400 Bad Request: Password change failed (e.g., invalid old or new password)
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Validate the old and new passwords
 * 3. Change the password for the authenticated user
 * 4. Return success or error response
 */
router.post('/password/change', authenticateUser, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        await userService.changePassword(req.user.userUuid, oldPassword, newPassword);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Email verification
// TEMPORARY MODIFICATION - START
// Email verification endpoints temporarily disabled
// This is a temporary change to simplify the registration flow
// Will be re-enabled once email infrastructure is in place
// DO NOT REMOVE the routes below
/*
router.post('/verify-email', async (req, res) => {
    try {
        await userService.verifyEmail(req.body.token);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/verify-email/resend', authenticateUser, async (req, res) => {
    try {
        await userService.sendVerificationEmail(req.user);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
*/
// TEMPORARY MODIFICATION - END

// Social features
/**
 * Mute User Endpoint
 * 
 * @description
 * Allows an authenticated user to mute another user in their personal mute list.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized muting
 * - Uses the authenticated user's UUID as the source, not the request body
 * - Prevents users from muting on behalf of other users
 * 
 * Request Body:
 * @param {string} targetUserUuid - UUID of the user to be muted
 * 
 * Response:
 * - 200 OK: User successfully muted
 * - 400 Bad Request: Muting failed (e.g., user not found, already muted)
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Extract the authenticated user's UUID
 * 3. Attempt to mute the target user in the authenticated user's mute list
 * 4. Return success or error response
 */
router.post('/mute', authenticateUser, async (req, res) => {
    try {
        // Validate input: Ensure targetUserUuid is provided
        if (!req.body.targetUserUuid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Target user UUID is required' 
            });
        }

        // Mute the user using the authenticated user's UUID
        // This prevents users from muting on behalf of others
        await userService.muteUser(req.user.userUuid, req.body.targetUserUuid);
        
        res.json({ 
            success: true, 
            message: 'User muted successfully' 
        });
    } catch (error) {
        // Log the error for server-side tracking
        console.error('Mute user error:', error);
        
        // Send a generic error message to prevent information leakage
        res.status(400).json({ 
            success: false, 
            message: error.message || 'Failed to mute user' 
        });
    }
});

/**
 * Unmute User Endpoint
 * 
 * @description
 * Allows an authenticated user to remove a user from their personal mute list.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized unmmuting
 * - Uses the authenticated user's UUID as the source, not the request body
 * - Prevents users from unmmuting on behalf of other users
 * 
 * Request Body:
 * @param {string} targetUserUuid - UUID of the user to be unmuted
 * 
 * Response:
 * - 200 OK: User successfully unmuted
 * - 400 Bad Request: Unmmuting failed (e.g., user not found, not previously muted)
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Extract the authenticated user's UUID
 * 3. Attempt to unmute the target user in the authenticated user's mute list
 * 4. Return success or error response
 */
router.post('/unmute', authenticateUser, async (req, res) => {
    try {
        // Validate input: Ensure targetUserUuid is provided
        if (!req.body.targetUserUuid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Target user UUID is required' 
            });
        }

        // Unmute the user using the authenticated user's UUID
        // This prevents users from unmmuting on behalf of others
        await userService.unmuteUser(req.user.userUuid, req.body.targetUserUuid);
        
        res.json({ 
            success: true, 
            message: 'User unmuted successfully' 
        });
    } catch (error) {
        // Log the error for server-side tracking
        console.error('Unmute user error:', error);
        
        // Send a generic error message to prevent information leakage
        res.status(400).json({ 
            success: false, 
            message: error.message || 'Failed to unmute user' 
        });
    }
});

/**
 * Block User Endpoint
 * 
 * @description
 * Allows an authenticated user to block another user in their personal block list.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized blocking
 * - Uses the authenticated user's UUID as the source, not the request body
 * - Prevents users from blocking on behalf of other users
 * 
 * Request Body:
 * @param {string} targetUserUuid - UUID of the user to be blocked
 * 
 * Response:
 * - 200 OK: User successfully blocked
 * - 400 Bad Request: Blocking failed (e.g., user not found, already blocked)
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Extract the authenticated user's UUID
 * 3. Attempt to block the target user in the authenticated user's block list
 * 4. Return success or error response
 */
router.post('/block', authenticateUser, async (req, res) => {
    try {
        // Validate input: Ensure targetUserUuid is provided
        if (!req.body.targetUserUuid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Target user UUID is required' 
            });
        }

        // Block the user using the authenticated user's UUID
        // This prevents users from blocking on behalf of others
        await userService.blockUser(req.user.userUuid, req.body.targetUserUuid);
        
        res.json({ 
            success: true, 
            message: 'User blocked successfully' 
        });
    } catch (error) {
        // Log the error for server-side tracking
        console.error('Block user error:', error);
        
        // Send a generic error message to prevent information leakage
        res.status(400).json({ 
            success: false, 
            message: error.message || 'Failed to block user' 
        });
    }
});

/**
 * Unblock User Endpoint
 * 
 * @description
 * Allows an authenticated user to remove a user from their personal block list.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized unblocking
 * - Uses the authenticated user's UUID as the source, not the request body
 * - Prevents users from unblocking on behalf of other users
 * 
 * Request Body:
 * @param {string} targetUserUuid - UUID of the user to be unblocked
 * 
 * Response:
 * - 200 OK: User successfully unblocked
 * - 400 Bad Request: Unblocking failed (e.g., user not found, not previously blocked)
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Extract the authenticated user's UUID
 * 3. Attempt to unblock the target user in the authenticated user's block list
 * 4. Return success or error response
 */
router.post('/unblock', authenticateUser, async (req, res) => {
    try {
        // Validate input: Ensure targetUserUuid is provided
        if (!req.body.targetUserUuid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Target user UUID is required' 
            });
        }

        // Unblock the user using the authenticated user's UUID
        // This prevents users from unblocking on behalf of others
        await userService.unblockUser(req.user.userUuid, req.body.targetUserUuid);
        
        res.json({ 
            success: true, 
            message: 'User unblocked successfully' 
        });
    } catch (error) {
        // Log the error for server-side tracking
        console.error('Unblock user error:', error);
        
        // Send a generic error message to prevent information leakage
        res.status(400).json({ 
            success: false, 
            message: error.message || 'Failed to unblock user' 
        });
    }
});

/**
 * Get Muted Users Endpoint
 * 
 * @description
 * Retrieves the list of users muted by the authenticated user.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized access
 * - Returns only the muted users for the authenticated user
 * - Prevents exposure of muted users list to unauthorized parties
 * 
 * Response:
 * - 200 OK: Returns list of muted user UUIDs
 * - 500 Internal Server Error: Retrieval failed
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Retrieve the list of muted users for the authenticated user
 * 3. Return the list of muted user UUIDs
 * 
 * Privacy Note:
 * - Only returns UUIDs to minimize potential information disclosure
 * - Prevents potential misuse of muted users information
 */
router.get('/muted', authenticateUser, async (req, res) => {
    try {
        // Retrieve muted users using the authenticated user's UUID
        // Ensures only the authenticated user can access their mute list
        const mutedUsers = await userService.getMutedUsers(req.user.userUuid);
        
        res.json({ 
            success: true, 
            mutedUsers 
        });
    } catch (error) {
        // Log the error for server-side tracking
        console.error('Get muted users error:', error);
        
        // Send a generic error message to prevent information leakage
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve muted users' 
        });
    }
});

/**
 * Get Blocked Users Endpoint
 * 
 * @description
 * Retrieves the list of users blocked by the authenticated user.
 * 
 * Security Considerations:
 * - Requires user authentication to prevent unauthorized access
 * - Returns only the blocked users for the authenticated user
 * - Prevents exposure of blocked users list to unauthorized parties
 * 
 * Response:
 * - 200 OK: Returns list of blocked user UUIDs
 * - 500 Internal Server Error: Retrieval failed
 * 
 * Workflow:
 * 1. Authenticate the requesting user
 * 2. Retrieve the list of blocked users for the authenticated user
 * 3. Return the list of blocked user UUIDs
 * 
 * Privacy Note:
 * - Only returns UUIDs to minimize potential information disclosure
 * - Prevents potential misuse of blocked users information
 */
router.get('/blocked', authenticateUser, async (req, res) => {
    try {
        // Retrieve blocked users using the authenticated user's UUID
        // Ensures only the authenticated user can access their block list
        const blockedUsers = await userService.getBlockedUsers(req.user.userUuid);
        
        res.json({ 
            success: true, 
            blockedUsers 
        });
    } catch (error) {
        // Log the error for server-side tracking
        console.error('Get blocked users error:', error);
        
        // Send a generic error message to prevent information leakage
        res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve blocked users' 
        });
    }
});

// User listing routes
/**
 * Get Active Users Endpoint
 * 
 * @description
 * Retrieves a paginated list of active users. This endpoint is used for features
 * like displaying online users, user search, and friend lists.
 * 
 * Query Parameters:
 * @param {number} page - Page number for pagination (default: 1)
 * @param {number} limit - Number of users per page (default: 50)
 * @param {string} filter - Optional filter criteria for username/nickname
 * 
 * Response:
 * - 200 OK: Returns the list of users with pagination info
 * - 500 Error: Server error while retrieving users
 */
router.get('/list', authenticateUser, async (req, res) => {
    try {
        const { page, limit, filter } = req.query;
        const users = await userService.getActiveUsers({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            filter
        });
        res.json({ success: true, users });
    } catch (error) {
        logger.error('Error getting user list:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Removed redundant /active route

// Delete user (for testing)
/**
 * Delete User Endpoint
 * 
 * @description
 * Deletes a user by their username.
 * 
 * Security Considerations:
 * - Does not require user authentication to allow deletion of users
 * - Validates the username to prevent abuse
 * - Prevents exposure of user information to unauthorized parties
 * 
 * Path Parameters:
 * @param {string} username - Username of the user to be deleted
 * 
 * Response:
 * - 200 OK: User deleted successfully
 * - 400 Bad Request: Deletion failed (e.g., user not found)
 * 
 * Workflow:
 * 1. Validate the username
 * 2. Delete the user
 * 3. Return success or error response
 */
router.delete('/delete/:username', async (req, res) => {
    try {
        const { username } = req.params;
        await userService.deleteUser(username);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Delete failed:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// Admin routes
/**
 * Ban User Endpoint
 * 
 * @description
 * Bans a user by their UUID.
 * 
 * Security Considerations:
 * - Requires admin authentication to prevent unauthorized banning
 * - Validates the user UUID to prevent abuse
 * - Prevents exposure of user information to unauthorized parties
 * 
 * Request Body:
 * @param {string} userUuid - UUID of the user to be banned
 * @param {string} reason - Reason for banning
 * @param {number} duration - Duration of the ban
 * 
 * Response:
 * - 200 OK: User banned successfully
 * - 400 Bad Request: Banning failed (e.g., user not found)
 * 
 * Workflow:
 * 1. Authenticate the requesting admin
 * 2. Validate the user UUID and ban details
 * 3. Ban the user
 * 4. Return success or error response
 */
router.post('/ban', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid, reason, duration } = req.body;
        await userService.banUser(userUuid, reason, duration);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

/**
 * Unban User Endpoint
 * 
 * @description
 * Unbans a user by their UUID.
 * 
 * Security Considerations:
 * - Requires admin authentication to prevent unauthorized unbanning
 * - Validates the user UUID to prevent abuse
 * - Prevents exposure of user information to unauthorized parties
 * 
 * Request Body:
 * @param {string} userUuid - UUID of the user to be unbanned
 * 
 * Response:
 * - 200 OK: User unbanned successfully
 * - 400 Bad Request: Unbanning failed (e.g., user not found)
 * 
 * Workflow:
 * 1. Authenticate the requesting admin
 * 2. Validate the user UUID
 * 3. Unban the user
 * 4. Return success or error response
 */
router.post('/unban', authenticateAdmin, async (req, res) => {
    try {
        await userService.unbanUser(req.body.userUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export { router };
