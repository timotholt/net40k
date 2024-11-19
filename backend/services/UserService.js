import bcrypt from 'bcryptjs';
import { ValidationError, AuthError, NotFoundError } from '../utils/errors.js';
import { UserDB } from '../models/User.js';
import { EmailService } from './EmailService.js';
import SessionManager from './SessionManager.js';
import { UuidService } from './UuidService.js';

class UserService {
    async initialize() {
        console.log('Initializing UserService...');
        // Add any initialization logic here
        return this;
    }

    // Authentication methods
    async register(userData) {
        const { username, nickname, password } = userData;

        console.log('🚀 UserService: Starting registration process...');
        console.log('📝 Registration details:');
        console.log('   - Username:', username);
        console.log('   - Nickname:', nickname || username);
        console.log('   - Password length:', password?.length || 'missing');

        // Validate input
        if (!username || !password) {
            console.log('❌ Registration failed: Missing required fields');
            throw new ValidationError('Missing required fields');
        }
        
        // Check for existing user
        console.log('🔍 Checking for existing user...');
        const existingUser = await UserDB.findOne({ username });
        if (existingUser) {
            console.log('❌ Registration failed: Username already exists');
            throw new ValidationError('Username already exists');
        }

        // Create user
        console.log('👤 Creating new user...');
        const userUuid = UuidService.generate();
        const user = await UserDB.create({
            userUuid,
            username,
            nickname: nickname || username,
            password, // Pass raw password, let User model handle hashing
            createdAt: new Date()
        });

        console.log('✅ User created successfully:', user?.userUuid);
        const sanitizedUser = this.sanitizeUser(user);
        return sanitizedUser;
    }

    async login(username, password) {
        try {
            // Use findByCredentials which properly handles password comparison
            const user = await UserDB.findByCredentials(username, password);

            // Create session (this will remove any existing sessions)
            const sessionToken = SessionManager.createSession(user.userUuid);

            // Update last login time
            await UserDB.updateLastLogin(user.userUuid);

            return {
                user: this.sanitizeUser(user),
                sessionToken
            };
        } catch (error) {
            // Log the error but don't expose internal details
            console.error('Login failed:', error.message);
            throw new AuthError('Invalid credentials');
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
        return this.sanitizeUser(user);
    }

    async updateProfile(userUuid, updates) {
        const allowedUpdates = ['displayName', 'avatar', 'bio'];
        const updateData = {};
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = updates[key];
            }
        });

        updateData.updatedAt = new Date();

        const user = await UserDB.findOneAndUpdate(
            { userUuid },
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.sanitizeUser(user);
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
                    updatedAt: new Date()
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
                    resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
                    updatedAt: new Date()
                }
            }
        );

        await EmailService.sendPasswordResetEmail(user.email, resetToken);
    }

    async resetPassword(token, newPassword) {
        const user = await UserDB.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
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
                    updatedAt: new Date()
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

        return users.map(user => this.sanitizeUser(user));
    }

    async banUser(userUuid, reason, duration) {
        const banExpiry = duration ? new Date(Date.now() + duration) : null;
        
        await UserDB.updateOne(
            { userUuid },
            { 
                $set: { 
                    banned: true,
                    banReason: reason,
                    banExpiry,
                    updatedAt: new Date()
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
                    updatedAt: new Date()
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
            console.error(`Failed to delete user ${username}:`, error.message);
            throw error;
        }
    }

    // Utility methods
    sanitizeUser(user) {
        if (!user) return null;
        
        // Create a new object with only the fields we want to expose
        return {
            userUuid: user.userUuid,
            username: user.username,
            nickname: user.nickname,
            email: user.email,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            isAdmin: user.isAdmin,
            isActive: user.isActive,
            isVerified: user.isVerified,
            preferences: user.preferences
        };
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
                    verificationTokenExpiry: new Date(Date.now() + 86400000), // 24 hours
                    updatedAt: new Date()
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
        // DO NOT REMOVE the verification code below
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
                    updatedAt: new Date()
                }
            }
        );

        return this.sanitizeUser(user);
        */
        return true;
    }
}

// Create and export a singleton instance
const userService = new UserService();
export { userService };