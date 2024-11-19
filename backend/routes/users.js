import express from 'express';
import { userService } from '../services/UserService.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Debug middleware for user routes
router.use((req, res, next) => {
    console.log('User Routes - Incoming request:', {
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
        console.error('Registration error:', error.message);
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
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.userUuid);
        res.json({ success: true, user });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

router.put('/profile', authenticateUser, async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.userUuid, req.body);
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Password management
router.post('/password/reset-request', createRateLimit('passwordReset'), async (req, res) => {
    try {
        await userService.requestPasswordReset(req.body.email);
        res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/password/reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await userService.resetPassword(token, newPassword);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

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
router.post('/mute', authenticateUser, async (req, res) => {
    try {
        await userService.muteUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/unmute', authenticateUser, async (req, res) => {
    try {
        await userService.unmuteUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/block', authenticateUser, async (req, res) => {
    try {
        await userService.blockUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/unblock', authenticateUser, async (req, res) => {
    try {
        await userService.unblockUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get('/muted', authenticateUser, async (req, res) => {
    try {
        const mutedUsers = await userService.getMutedUsers(req.user.userUuid);
        res.json({ success: true, mutedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/blocked', authenticateUser, async (req, res) => {
    try {
        const blockedUsers = await userService.getBlockedUsers(req.user.userUuid);
        res.json({ success: true, blockedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete user (for testing)
router.delete('/delete/:username', async (req, res) => {
    try {
        const { username } = req.params;
        await userService.deleteUser(username);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete failed:', error.message);
        res.status(400).json({ error: error.message });
    }
});

// Admin routes
router.get('/list', authenticateAdmin, async (req, res) => {
    try {
        const { page, limit, filter } = req.query;
        const users = await userService.getActiveUsers({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            filter: filter ? JSON.parse(filter) : {}
        });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/ban', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid, reason, duration } = req.body;
        await userService.banUser(userUuid, reason, duration);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/unban', authenticateAdmin, async (req, res) => {
    try {
        await userService.unbanUser(req.body.userUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export { router };
