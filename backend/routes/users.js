import express from 'express';
import UserService from '../services/UserService.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';
import { ValidationError } from '../utils/errors.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Authentication routes
router.post('/user/register', rateLimit('register'), async (req, res) => {
    try {
        const user = await UserService.register(req.body);
        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/login', rateLimit('login'), async (req, res) => {
    try {
        const { username, password, deviceInfo } = req.body;
        const result = await UserService.login(username, password, deviceInfo);
        res.json({ 
            success: true, 
            user: result.user,
            sessionToken: result.sessionToken,
            device: result.device
        });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});

router.post('/user/logout', authenticateUser, async (req, res) => {
    try {
        await UserService.logout(req.sessionToken);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Session management
router.post('/user/session/validate', async (req, res) => {
    try {
        const { sessionToken } = req.body;
        const session = await UserService.validateSession(sessionToken);
        const user = await UserService.getProfile(session.userUuid);
        res.json({ 
            success: true, 
            user,
            session: {
                createdAt: session.createdAt,
                lastActive: session.lastActive,
                deviceInfo: session.deviceInfo
            }
        });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
});

router.get('/user/sessions', authenticateUser, async (req, res) => {
    try {
        const sessions = await UserService.getUserSessions(req.user.userUuid);
        res.json({ 
            success: true, 
            sessions: sessions.map(s => ({
                token: s.token,
                createdAt: s.createdAt,
                lastActive: s.lastActive,
                deviceInfo: s.deviceInfo,
                current: s.token === req.sessionToken
            }))
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/session/terminate', authenticateUser, async (req, res) => {
    try {
        const { sessionToken } = req.body;
        // Only allow terminating own sessions unless admin
        if (!req.user.isAdmin) {
            const session = await UserService.validateSession(sessionToken);
            if (session.userUuid !== req.user.userUuid) {
                throw new ValidationError('Cannot terminate other users\' sessions');
            }
        }
        await UserService.terminateSession(sessionToken);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/sessions/terminate-all', authenticateUser, async (req, res) => {
    try {
        const { exceptCurrent = true } = req.body;
        await UserService.terminateAllUserSessions(
            req.user.userUuid, 
            exceptCurrent ? req.sessionToken : null
        );
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Profile and account management
router.get('/user/profile', authenticateUser, async (req, res) => {
    try {
        const profile = await UserService.getProfile(req.user.userUuid);
        res.json({ success: true, profile });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.put('/user/profile', authenticateUser, async (req, res) => {
    try {
        const updatedUser = await UserService.updateProfile(req.user.userUuid, req.body);
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Security features
router.post('/user/password/change', authenticateUser, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        await UserService.changePassword(req.user.userUuid, oldPassword, newPassword);
        // Optionally terminate other sessions for security
        if (req.body.terminateOtherSessions) {
            await UserService.terminateAllUserSessions(req.user.userUuid, req.sessionToken);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/password/reset/request', rateLimit('passwordReset'), async (req, res) => {
    try {
        const { email } = req.body;
        await UserService.requestPasswordReset(email);
        // Always return success to prevent email enumeration
        res.json({ success: true });
    } catch (error) {
        res.json({ success: true });
    }
});

router.post('/user/password/reset/confirm', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        await UserService.resetPassword(token, newPassword);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Device management
router.post('/user/device/register', authenticateUser, async (req, res) => {
    try {
        const { deviceName, deviceType, pushToken } = req.body;
        const device = await UserService.registerDevice(req.user.userUuid, {
            deviceName,
            deviceType,
            pushToken,
            sessionToken: req.sessionToken
        });
        res.json({ success: true, device });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/user/devices', authenticateUser, async (req, res) => {
    try {
        const devices = await UserService.getUserDevices(req.user.userUuid);
        res.json({ success: true, devices });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.delete('/user/device', authenticateUser, async (req, res) => {
    try {
        const { deviceId } = req.body;
        await UserService.removeDevice(req.user.userUuid, deviceId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Social features
router.post('/user/mute', authenticateUser, async (req, res) => {
    try {
        const { targetUserUuid } = req.body;
        await UserService.muteUser(req.user.userUuid, targetUserUuid);
        const mutedList = UserService.getMutedUsers(req.user.userUuid);
        res.json({ success: true, mutedUsers: mutedList });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/unmute', authenticateUser, async (req, res) => {
    try {
        const { targetUserUuid } = req.body;
        await UserService.unmuteUser(req.user.userUuid, targetUserUuid);
        const mutedList = UserService.getMutedUsers(req.user.userUuid);
        res.json({ success: true, mutedUsers: mutedList });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/block', authenticateUser, async (req, res) => {
    try {
        const { targetUserUuid } = req.body;
        await UserService.blockUser(req.user.userUuid, targetUserUuid);
        const blockedList = UserService.getBlockedUsers(req.user.userUuid);
        res.json({ success: true, blockedUsers: blockedList });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/unblock', authenticateUser, async (req, res) => {
    try {
        const { targetUserUuid } = req.body;
        await UserService.unblockUser(req.user.userUuid, targetUserUuid);
        const blockedList = UserService.getBlockedUsers(req.user.userUuid);
        res.json({ success: true, blockedUsers: blockedList });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// TODO: Game and Room REST Endpoints
// - Add POST /user/room/join for HTTP room joins
// - Add POST /user/room/leave for leaving rooms
// - Add GET /user/games for fetching active games
// - Add GET /user/rooms for fetching joined rooms
// - Add rate limiting for room/game operations

// Admin routes
router.get('/user/list', authenticateAdmin, async (req, res) => {
    try {
        const { page, limit, filter } = req.query;
        const users = await UserService.getActiveUsers({
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            filter
        });
        res.json({ success: true, users });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/ban', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid, reason, duration } = req.body;
        await UserService.banUser(userUuid, reason, duration);
        // Terminate all user sessions when banned
        await UserService.terminateAllUserSessions(userUuid);
        await UserService.logSecurityEvent(userUuid, 'ban', {
            adminUuid: req.user.userUuid,
            reason,
            duration
        });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/unban', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid } = req.body;
        await UserService.unbanUser(userUuid);
        await UserService.logSecurityEvent(userUuid, 'unban', {
            adminUuid: req.user.userUuid
        });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/user/security-log', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid, startDate, endDate, type } = req.query;
        const logs = await UserService.getSecurityLogs(userUuid, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            type
        });
        res.json({ success: true, logs });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/user/force-logout', authenticateAdmin, async (req, res) => {
    try {
        const { userUuid, reason } = req.body;
        await UserService.terminateAllUserSessions(userUuid);
        await UserService.logSecurityEvent(userUuid, 'force-logout', {
            adminUuid: req.user.userUuid,
            reason
        });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
