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
        const { username, email, password } = userData;
        
        // Validate input
        if (!username || !email || !password) {
            throw new ValidationError('Missing required fields');
        }
        
        // Check for existing user
        const existingUser = await UserDB.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            throw new ValidationError('Username or email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userUuid = UuidService.generate();
        const user = await UserDB.create({
            userUuid,
            username,
            email,
            password: hashedPassword,
            isVerified: false,
            verificationToken: UuidService.generate()
        });

        return this.sanitizeUser(user);
    }

    async login(username, password) {
        const user = await UserDB.findOne({ username });
        if (!user) {
            throw new AuthError('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AuthError('Invalid credentials');
        }

        if (user.banned) {
            throw new AuthError('Account is banned');
        }

        // Create session (this will remove any existing sessions)
        const sessionToken = SessionManager.createSession(user.userUuid);

        return {
            user: this.sanitizeUser(user),
            sessionToken
        };
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

    // Utility methods
    sanitizeUser(user) {
        const sanitized = { ...user.toObject() };
        delete sanitized.password;
        delete sanitized._id;
        delete sanitized.__v;
        return sanitized;
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
        const user = await UserDB.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            throw new ValidationError('Invalid or expired verification token');
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
    }
}

// Create and export a singleton instance
const userService = new UserService();
export { userService };