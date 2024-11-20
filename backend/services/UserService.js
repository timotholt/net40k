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
        logger.debug('👤 Creating new user...');
        const user = await UserDB.create({
            username,
            nickname: nickname || username,
            password,
            email,
            createdAt: DateService.now().date
        });

        logger.info('✅ User created successfully:', user.toMediumUser());
        return user.toMediumUser();
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

            logger.info('Login successful for user:', username);
            return {
                user: user.toMediumUser(),
                sessionToken
            };
        } catch (error) {
            // Log the error but don't expose internal details
            logger.error('Login failed:', error.message);
            throw new AuthError('Username not found');
        }
    }

    async logout(sessionToken) {
        SessionManager.removeSession(sessionToken);
    }

    // Session management
    async validateSession(sessionToken) {
        const session = SessionManager.getSession(sessionToken);
        if (!session) {
            throw new AuthError('Invalid session');
        }

        const user = await UserDB.findOne({ userUuid: session.userUuid });
        if (!user || user.banned) {
            SessionManager.removeSession(sessionToken);
            throw new AuthError('User not found or banned');
        }

        return session;
    }

    validateSession(token) {
        return SessionManager.validateSession(token);
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
        return user.toMediumUser();
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

        return user.toMediumUser();
    }

    async getUsers(query = {}, options = {}) {
        const { skip = 0, limit = 10 } = options;

        const users = await UserDB.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return users.map(user => user.toSmallUser());
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
        await UserDB.updateOne(
            { userUuid },
            { $addToSet: { mutedUsers: targetUserUuid } }
        );
    }

    async unmuteUser(userUuid, targetUserUuid) {
        await UserDB.updateOne(
            { userUuid },
            { $pull: { mutedUsers: targetUserUuid } }
        );
    }

    async blockUser(userUuid, targetUserUuid) {
        await UserDB.updateOne(
            { userUuid },
            { $addToSet: { blockedUsers: targetUserUuid } }
        );
    }

    async unblockUser(userUuid, targetUserUuid) {
        await UserDB.updateOne(
            { userUuid },
            { $pull: { blockedUsers: targetUserUuid } }
        );
    }

    async getMutedUsers(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        return user ? user.mutedUsers : [];
    }

    async getBlockedUsers(userUuid) {
        const user = await UserDB.findOne({ userUuid });
        return user ? user.blockedUsers : [];
    }

    // TODO: Game Session Integration
    // - Implement addActiveGame(userUuid, gameUuid) to track user's active games
    // - Implement removeActiveGame(userUuid, gameUuid) when game ends
    // - Add getActiveGames(userUuid) to fetch user's current games
    // - Add validation to prevent joining multiple games
    // - Consider game state persistence for reconnects

    // Admin methods
    async getActiveUsers({ page = 1, limit = 50, filter = {} }) {
        const query = { ...filter };
        const skip = (page - 1) * limit;

        const users = await UserDB.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return users.map(user => user.toMediumUser());
    }

    async banUser(userUuid, reason, duration) {
        const banExpiry = duration ? DateService.now().date.getTime() + duration : null;
        
        await UserDB.updateOne(
            { userUuid },
            { 
                $set: { 
                    banned: true,
                    banReason: reason,
                    banExpiry,
                    updatedAt: DateService.now().date
                }
            }
        );

        // Terminate all sessions when banned
        SessionManager.removeUserSessions(userUuid);
    }

    async unbanUser(userUuid) {
        await UserDB.updateOne(
            { userUuid },
            { 
                $set: { 
                    banned: false,
                    banReason: null,
                    banExpiry: null,
                    updatedAt: DateService.now().date
                }
            }
        );
    }

    async deleteUser(username) {
        try {
            const user = await UserDB.findOne({ username });
            if (!user) {
                throw new ValidationError('User not found');
            }
            await UserDB.delete({ username });
            return { success: true };
        } catch (error) {
            logger.error(`Failed to delete user ${username}:`, error.message);
            throw error;
        }
    }

    // Utility methods
    async getServerUsers() {
        try {
            const users = await UserDB.find({});
            return users.map(user => user.toSmallUser());
        } catch (error) {
            logger.error('Error fetching server users:', error);
            return [];
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

        return user.toMediumUser();
        */
        return true;
    }
}

// Create and export a singleton instance
const userService = new UserService();
export { userService };