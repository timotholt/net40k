import bcrypt from 'bcryptjs';
import { ValidationError, AuthError, NotFoundError } from '../utils/errors.js';
import { UserDB } from '../models/User.js';
import { EmailService } from './EmailService.js';
import SessionManager from './SessionManager.js';
import { UuidService } from './UuidService.js';
import DateService from './DateService.js';
import logger from '../utils/logger.js';

class UserService {
    async initialize() {
        logger.info('Initializing UserService...');
        // Add any initialization logic here
        return this;
    }

    // Authentication methods
    async checkUserExists(username) {
        logger.info('🔍 Checking for existing user...', { username });
        const existingUser = await UserDB.findOne({ username });
        logger.info('🔍 FindOne result:', { 
            exists: !!existingUser,
            userData: existingUser ? {
                username: existingUser.username,
                userUuid: existingUser.userUuid,
                createdAt: existingUser.createdAt
            } : null
        });
        return existingUser;
    }

    async register(userData) {
        try {
            const { username, nickname, password } = userData;

            logger.info('🚀 UserService: Starting registration process...');
            logger.info('📝 Registration details:', { 
                username, 
                nickname: nickname || username,
                passwordLength: password?.length || 'missing'
            });

            // Validate input
            if (!username || !password) {
                logger.error('❌ Registration failed: Missing required fields');
                throw new ValidationError('Missing required fields');
            }
            
            // Check for existing user
            logger.debug('🔍 Checking for existing user...');
            const email = UuidService.generate();
            const existingUser = await UserDB.findOne({ 
                $or: [
                    { username },
                    { email }
                ]
            });

            if (existingUser) {
                const errorMessage = existingUser.username === username 
                    ? 'Username already exists' 
                    : 'Email already exists';
                
                logger.error(`❌ Registration failed: ${errorMessage}`);
                const errorObj = new ValidationError(errorMessage);
                logger.error('Backend Error Object Details:', {
                    name: errorObj.name,
                    message: errorObj.message,
                    toString: errorObj.toString(),
                    stack: errorObj.stack
                });
                throw errorObj;
            }

            // Create user
            const user = await UserDB.create({
                username,
                nickname: nickname || username,
                password,
                email,
                createdAt: DateService.now().date
            });

            // Return private user info since this is their own profile
            const userJson = user.toSelfUser();

            logger.info('✅ User created successfully:', userJson);
            return userJson;
        } catch (error) {
            logger.error('Registration failed:', {
                username: userData.username,
                errorMessage: error.message,
                errorName: error.name,
                stack: error.stack
            });
            throw error;
        }
    }

    async login(username, password) {
        try {
            logger.debug('Starting login process for user:', username);
            
            // Use findByCredentials which properly handles password comparison
            const user = await UserDB.findByCredentials(username, password);

            // Create session (this will remove any existing sessions)
            const sessionToken = SessionManager.createSession(user.userUuid);

            // Update last login time
            await UserDB.updateLastLogin(user.userUuid);

            // Return user data
            return {
                user: user.toSelfUser(),
                sessionToken
            };
        } catch (error) {
            // Log the error with full details
            logger.error('Login failed:', {
                username,
                errorMessage: error.message,
                errorName: error.name,
                stack: error.stack
            });
            
            // Rethrow the original error to preserve error type
            throw error;
        }
    }

    async logout(sessionToken) {
        SessionManager.removeSession(sessionToken);
    }

    // Session management
    async validateSession(sessionToken) {
        try {
            const session = SessionManager.getSession(sessionToken);
            if (!session) {
                throw new AuthError('Invalid session');
            }

            const user = await UserDB.findOne({ userUuid: session.userUuid });
            if (!user || user.banned) {
                SessionManager.removeSession(sessionToken);
                throw new AuthError('User not found or banned');
            }

            return {
                ...session,
                user: user.toPublicUser()
            };
        } catch (error) {
            logger.error('Session validation error:', {
                sessionToken,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    async isAdmin(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        return user?.isAdmin || false;
    }

    // Profile management
    async getProfile(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return user.toSelfUser();
    }

    async updateProfile(userUuid, updates) {
        const allowedUpdates = ['displayName', 'avatar', 'bio'];
        const updateData = {};
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = updates[key];
            }
        });

        updateData.updatedAt = DateService.now().date;

        const user = await UserDB.findOneAndUpdate(
            { userUuid },
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return user.toSelfUser();
    }

    async verifyProfile(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        const requiredFields = {
            displayName: 'Display name is required',
        };

        const errors = [];
        let isValid = true;

        for (const [field, message] of Object.entries(requiredFields)) {
            if (!user[field]) {
                errors.push(message);
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    /**
     * Updates a user's profile information
     * @param {string} userUuid - The UUID of the user to update
     * @param {Object} updates - The fields to update
     * @param {string} [updates.nickname] - The new nickname
     * @param {string} [updates.avatar] - The new avatar URL
     * @param {string} [updates.currentPassword] - The current password (required for password changes)
     * @param {string} [updates.newPassword] - The new password (required for password changes)
     * @returns {Promise<Object>} The updated user object
     */
    async updateProfile(userUuid, updates) {
        const user = await UserDB.findOne({ userUuid });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const updateData = {};
        
        // Handle nickname update
        if (updates.nickname !== undefined) {
            if (updates.nickname.length < 2 || updates.nickname.length > 30) {
                throw new ValidationError('Nickname must be between 2 and 30 characters');
            }
            updateData.nickname = updates.nickname;
            logger.info(`Updating nickname for user ${userUuid}`, { nickname: updates.nickname });
        }
        
        // Handle avatar update
        if (updates.avatar !== undefined) {
            // Basic URL validation - you might want to enhance this
            try {
                new URL(updates.avatar);
                updateData.avatar = updates.avatar;
                logger.info(`Updating avatar for user ${userUuid}`);
            } catch (e) {
                throw new ValidationError('Invalid avatar URL');
            }
        }
        
        // Handle password change if new password is provided
        if (updates.newPassword) {
            if (!updates.currentPassword) {
                throw new ValidationError('Current password is required to change password');
            }
            
            // Verify current password
            const isMatch = await bcrypt.compare(updates.currentPassword, user.password);
            if (!isMatch) {
                throw new AuthError('Current password is incorrect');
            }
            
            // Validate new password
            if (updates.newPassword.length < 8) {
                throw new ValidationError('New password must be at least 8 characters long');
            }
            
            // Hash and update the new password
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updates.newPassword, salt);
            logger.info(`Updating password for user ${userUuid}`);
        }
        
        // If there are updates to apply
        if (Object.keys(updateData).length > 0) {
            const updatedUser = await UserDB.findOneAndUpdate(
                { userUuid },
                { $set: updateData },
                { new: true, runValidators: true }
            );
            
            // Remove sensitive data before returning
            const { password, ...userWithoutPassword } = updatedUser.toObject();
            return userWithoutPassword;
        }
        
        // If no updates were made, return the current user
        const { password, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }

    async getUsers(query = {}, options = {}) {
        try {
            const { page = 1, limit = 50 } = options;
            const skip = (page - 1) * limit;

            // Get users with pagination
            const users = await UserDB.find(query, { 
                sort: { createdAt: -1 },
                skip,
                limit
            });

            // Get total count for pagination
            const total = await UserDB.count(query);
            
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error('Error getting users:', error);
            throw error;
        }
    }

    // Security features
    async changePassword(userUuid, oldPassword, newPassword) {
        const user = await UserDB.findOne({ userUuid });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new ValidationError('Invalid current password');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await UserDB.updateOne(
            { userUuid },
            { 
                $set: { 
                    password: hashedPassword,
                    updatedAt: DateService.now().date
                }
            }
        );

        // Terminate session when password changes
        SessionManager.removeUserSessions(userUuid);
    }

    async requestPasswordReset(email) {
        const user = await UserDB.findOne({ email });
        if (!user) {
            return; // Silent return to prevent email enumeration
        }

        // Generate reset token
        const resetToken = UuidService.generate();
        
        // Store the reset token with an expiry
        await UserDB.updateOne(
            { userUuid: user.userUuid },
            { 
                $set: { 
                    resetToken,
                    resetTokenExpiry: DateService.now().date.getTime() + 3600000, // 1 hour
                    updatedAt: DateService.now().date
                }
            }
        );

        await EmailService.sendPasswordResetEmail(user.email, resetToken);
    }

    async resetPassword(token, newPassword) {
        const user = await UserDB.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: DateService.now().date }
        });
        
        if (!user) {
            throw new ValidationError('Invalid or expired reset token');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await UserDB.updateOne(
            { userUuid: user.userUuid },
            { 
                $set: { 
                    password: hashedPassword,
                    resetToken: null,
                    resetTokenExpiry: null,
                    updatedAt: DateService.now().date
                }
            }
        );

        // Terminate any existing sessions
        SessionManager.removeUserSessions(user.userUuid);
    }

    // Social features
    async muteUser(userUuid, targetUserUuid) {
        try {
            const user = await UserDB.findOne({ userUuid });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Ensure mutedUserUuids is unique
            if (!user.mutedUserUuids.includes(targetUserUuid)) {
                user.mutedUserUuids.push(targetUserUuid);
            }

            await UserDB.update({ userUuid }, { 
                mutedUserUuids: user.mutedUserUuids 
            });

            return { 
                success: true, 
                message: 'User muted',
                mutedUserUuids: user.mutedUserUuids
            };
        } catch (error) {
            logger.error(`Failed to mute user ${targetUserUuid} for user ${userUuid}:`, error.message);
            throw error;
        }
    }

    async unblockUser(userUuid, targetUserUuid) {
        try {
            const user = await UserDB.findOne({ userUuid });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Remove the targetUserUuid from blockedUserUuids
            const updatedBlockedUuids = user.blockedUserUuids.filter(uuid => uuid !== targetUserUuid);

            await UserDB.update({ userUuid }, { 
                blockedUserUuids: updatedBlockedUuids 
            });

            return { 
                success: true, 
                message: 'User unblocked',
                blockedUserUuids: updatedBlockedUuids
            };
        } catch (error) {
            logger.error(`Failed to unblock user ${targetUserUuid} for user ${userUuid}:`, error.message);
            throw error;
        }
    }

    async blockUser(userUuid, targetUserUuid) {
        try {
            const user = await UserDB.findOne({ userUuid });
            if (!user) {
                throw new NotFoundError('User not found');
            }

            // Ensure blockedUserUuids is unique
            if (!user.blockedUserUuids.includes(targetUserUuid)) {
                user.blockedUserUuids.push(targetUserUuid);
            }

            await UserDB.update({ userUuid }, { 
                blockedUserUuids: user.blockedUserUuids 
            });

            return { 
                success: true, 
                message: 'User blocked',
                blockedUserUuids: user.blockedUserUuids
            };
        } catch (error) {
            logger.error(`Failed to block user ${targetUserUuid} for user ${userUuid}:`, error.message);
            throw error;
        }
    }

    async getMutedUsers(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        return user ? user.mutedUserUuids : [];
    }

    async getBlockedUsers(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        return user ? user.blockedUserUuids : [];
    }

    // TODO: Game Session Integration
    // - Implement addActiveGame(userUuid, gameUuid) to track user's active games
    // - Implement removeActiveGame(userUuid, gameUuid) when game ends
    // - Add getActiveGames(userUuid) to fetch user's current games
    // - Add validation to prevent joining multiple games
    // - Consider game state persistence for reconnects

    // Admin methods
    async getActiveUsers({ page = 1, limit = 50, filter = {} }) {
        const query = { 
            isActive: true,
            isBanned: { $ne: true }
        };

        // Add text search if filter is provided
        if (filter) {
            query.$or = [
                { nickname: { $regex: filter, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        
        const [users, total] = await Promise.all([
            UserDB.find(query, { sort: { lastActive: -1 }, skip, limit }),
            UserDB.count(query)
        ]);

        // Add real-time online status from SessionManager
        const usersWithOnlineStatus = users.map(user => ({
            ...user,
            connectionStatus: SessionManager.getConnectionStatus(user.userUuid)
        }));

        return {
            users: usersWithOnlineStatus,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async deleteUser(username) {
        try {
            const user = await UserDB.findOne({ username });
            if (!user) {
                throw new NotFoundError('User not found');
            }
            await UserDB.update({ username }, { 
                isDeleted: true, 
                deletedAt: new Date() 
            });
            return { success: true, message: 'User soft deleted' };
        } catch (error) {
            logger.error(`Failed to delete user ${username}:`, error.message);
            throw error;
        }
    }

    async banUser(userUuid, reason, duration = null) {
        const lock = new Lock(`user_ban:${userUuid}`);
        
        try {
            await lock.acquire();
    
            const user = await UserDB.findOne({ userUuid });
            if (!user) throw new NotFoundError('User not found');
            if (user.isBanned) throw new ValidationError('User already banned');
            if (!reason) throw new ValidationError('Ban reason required');
    
            const banExpiresAt = duration ? new Date(Date.now() + duration) : null;
    
            await UserDB.update({ userUuid }, {
                isBanned: true,
                banReason: reason,
                banExpiresAt,
                bannedAt: new Date()
            });
    
            logger.info(`User ${userUuid} banned`, { reason, duration });
            await SessionManager.endUserSessions(userUuid);
    
            return { 
                success: true, 
                message: 'User banned', 
                banDetails: { reason, expiresAt: banExpiresAt }
            };
        } catch (error) {
            logger.error(`Ban failed for user ${userUuid}:`, error.message);
            throw error;
        } finally {
            await lock.release();
        }
    }
    
    async unbanUser(userUuid) {
        const lock = new Lock(`user_unban:${userUuid}`);
        
        try {
            await lock.acquire();
    
            const user = await UserDB.findOne({ userUuid });
            if (!user) throw new NotFoundError('User not found');
            if (!user.isBanned) throw new ValidationError('User not banned');
    
            await UserDB.update({ userUuid }, {
                isBanned: false,
                banReason: null,
                banExpiresAt: null,
                bannedAt: null
            });
    
            logger.info(`User ${userUuid} unbanned`);
    
            return { success: true, message: 'User unbanned' };
        } catch (error) {
            logger.error(`Unban failed for user ${userUuid}:`, error.message);
            throw error;
        } finally {
            await lock.release();
        }
    }
    
    // This is bascially a background type of task
    async checkAndRemoveExpiredBans() {
        try {
            const expiredUsers = await UserDB.find({
                isBanned: true,
                banExpiresAt: { $lt: new Date() }
            });
    
            for (const user of expiredUsers) {
                await this.unbanUser(user.userUuid);
            }
    
            logger.info(`Automatically unbanned ${expiredUsers.length} users`);
        } catch (error) {
            logger.error('Failed to remove expired bans:', error.message);
        }
    }

    // Utility methods
    async getServerUsers() {
        try {
            const users = await UserDB.find({});
            return users.map(user => user.toPublicUser());
        } catch (error) {
            logger.error('Error fetching server users:', error);
            return [];
        }
    }

    /**
     * Checks if a user has special elevated privileges.
     * 
     * Privilege determination follows two criteria:
     * 1. If the UUID is a predefined system user (via isSystemUser())
     * 2. If the user is an admin in the database
     * 
     * @param {string} userUuid - The UUID of the user to check
     * @returns {Promise<boolean>} - True if user has special privileges, false otherwise
     */
    async hasSpecialPrivileges(userUuid) {
        try {
            // First, check if this is a system user
            if (isSystemUser(userUuid)) {
                return true;
            }

            // If not a system user, check the database for admin status
            const user = await UserDB.findOne({ userUuid });
            
            // Return true if user is found and is an admin
            return user ? user.isAdmin === true : false;
        } catch (error) {
            logger.error(`Error checking user privileges: ${error.message}`);
            return false;
        }
    }

    async sendVerificationEmail(user) {
        // Generate verification token
        const verificationToken = UuidService.generate();
        
        // Store the verification token
        await UserDB.updateOne(
            { userUuid: user.userUuid },
            { 
                $set: { 
                    verificationToken,
                    verificationTokenExpiry: DateService.now().date.getTime() + 86400000, // 24 hours
                    updatedAt: DateService.now().date
                }
            }
        );

        await EmailService.sendVerificationEmail(user.email, verificationToken);
    }

    async verifyEmail(token) {
        // TEMPORARY MODIFICATION - START
        // Email verification disabled for initial development
        // This is a temporary change to simplify the registration flow
        // Will be re-enabled once email infrastructure is in place
        /*
        const user = await UserDB.findOne({ verificationToken: token });
        if (!user) {
            throw new ValidationError('Invalid verification token');
        }

        await UserDB.updateOne(
            { userUuid: user.userUuid },
            { 
                $set: { 
                    isVerified: true,
                    verificationToken: null,
                    verificationTokenExpiry: null,
                    updatedAt: DateService.now().date
                }
            }
        );

        return user.toPublicUser();
        */
        return true;
    }
}

// Create and export a singleton instance
const userService = new UserService();
export { userService };