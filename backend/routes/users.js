import express from 'express';
import { userService } from '../services/UserService.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';
import { createRateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Authentication routes
router.post('/user/register', createRateLimit('register'), async (req, res) => {
    try {
        // TEMPORARY MODIFICATION - START
        // Email verification disabled for initial development
        // This is a temporary change to simplify the registration flow
        // Will be re-enabled once email infrastructure is in place
        // DO NOT REMOVE the email validation below
        const { username, password } = req.body;
        // const { username, email, password } = req.body;

        const user = await userService.register({ 
            username, 
            // email,  // Temporarily disabled
            password 
        });
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/login', createRateLimit('login'), async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userService.login(username, password);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
});

router.post('/user/logout', authenticateUser, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        await userService.logout(token);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Profile routes
router.get('/user/profile', authenticateUser, async (req, res) => {
    try {
        const user = await userService.getProfile(req.user.userUuid);
        res.json({ success: true, user });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
});

router.put('/user/profile', authenticateUser, async (req, res) => {
    try {
        const user = await userService.updateProfile(req.user.userUuid, req.body);
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Password management
router.post('/user/password/reset-request', createRateLimit('passwordReset'), async (req, res) => {
    try {
        await userService.requestPasswordReset(req.body.email);
        res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/user/password/reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await userService.resetPassword(token, newPassword);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/password/change', authenticateUser, async (req, res) => {
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
router.post('/user/verify-email', async (req, res) => {
    try {
        await userService.verifyEmail(req.body.token);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/verify-email/resend', authenticateUser, async (req, res) => {
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
router.post('/user/mute', authenticateUser, async (req, res) => {
    try {
        await userService.muteUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/unmute', authenticateUser, async (req, res) => {
    try {
        await userService.unmuteUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/block', authenticateUser, async (req, res) => {
    try {
        await userService.blockUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/unblock', authenticateUser, async (req, res) => {
    try {
        await userService.unblockUser(req.user.userUuid, req.body.targetUserUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.get('/user/muted', authenticateUser, async (req, res) => {
    try {
        const mutedUsers = await userService.getMutedUsers(req.user.userUuid);
        res.json({ success: true, mutedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/user/blocked', authenticateUser, async (req, res) => {
    try {
        const blockedUsers = await userService.getBlockedUsers(req.user.userUuid);
        res.json({ success: true, blockedUsers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin routes
router.get('/user/list', authenticateAdmin, async (req, res) => {
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

router.post('/user/ban', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid, reason, duration } = req.body;
        await userService.banUser(userUuid, reason, duration);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/user/unban', authenticateAdmin, async (req, res) => {
    try {
        await userService.unbanUser(req.body.userUuid);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

export { router };
