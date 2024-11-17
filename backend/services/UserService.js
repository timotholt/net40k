import bcrypt from 'bcryptjs';
import { ValidationError, AuthenticationError, NotFoundError } from '../utils/errors.js';
import { User } from '../models/User.js';
import { config } from '../config/config.js';
import { EmailService } from './EmailService.js';
import SessionManager from './SessionManager.js';
import { UuidService } from './UuidService.js';

class UserService {
    // Authentication methods
    static async register(userData) {
        const { username, email, password } = userData;
        
        // Validate input
        if (!username || !email || !password) {
            throw new ValidationError('Missing required fields');
        }
        
        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            throw new ValidationError('Username or email already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            uuid: UuidService.generate(),
            username,
            email,
            password: hashedPassword,
            verified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Send verification email
        await this.sendVerificationEmail(user);

        return this.sanitizeUser(user);
    }

    static async login(username, password) {
        const user = await User.findOne({ username });
        if (!user) {
            throw new AuthenticationError('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new AuthenticationError('Invalid credentials');
        }

        if (user.banned) {
            throw new AuthenticationError('Account is banned');
        }

        // Create session (this will remove any existing sessions)
        const sessionToken = SessionManager.createSession(user.uuid);

        return {
            user: this.sanitizeUser(user),
            sessionToken
        };
    }

    static async logout(sessionToken) {
        SessionManager.removeSession(sessionToken);
    }

    // Session management
    static async validateSession(sessionToken) {
        const session = SessionManager.getSession(sessionToken);
        if (!session) {
            throw new AuthenticationError('Invalid session');
        }

        const user = await User.findOne({ uuid: session.userUuid });
        if (!user || user.banned) {
            SessionManager.removeSession(sessionToken);
            throw new AuthenticationError('User not found or banned');
        }

        return session;
    }

    // Profile management
    static async getProfile(userUuid) {
        const user = await User.findOne({ uuid: userUuid });
        if (!user) {
            throw new NotFoundError('User not found');
        }
        return this.sanitizeUser(user);
    }

    static async updateProfile(userUuid, updates) {
        const allowedUpdates = ['displayName', 'avatar', 'bio'];
        const updateData = {};
        
        Object.keys(updates).forEach(key => {
            if (allowedUpdates.includes(key)) {
                updateData[key] = updates[key];
            }
        });

        updateData.updatedAt = new Date();

        const user = await User.findOneAndUpdate(
            { uuid: userUuid },
            { $set: updateData },
            { new: true }
        );

        if (!user) {
            throw new NotFoundError('User not found');
        }

        return this.sanitizeUser(user);
    }

    // Security features
    static async changePassword(userUuid, oldPassword, newPassword) {
        const user = await User.findOne({ uuid: userUuid });
        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new ValidationError('Invalid current password');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { uuid: userUuid },
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

    static async requestPasswordReset(email) {
        const user = await User.findOne({ email });
        if (!user) {
            return; // Silent return to prevent email enumeration
        }

        // Generate reset token
        const resetToken = UuidService.generate();
        
        // Store the reset token with an expiry
        await User.updateOne(
            { uuid: user.uuid },
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

    static async resetPassword(token, newPassword) {
        const user = await User.findOne({
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            throw new ValidationError('Invalid or expired reset token');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.updateOne(
            { uuid: user.uuid },
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
        SessionManager.removeUserSessions(user.uuid);
    }

    // Social features
    static async muteUser(userUuid, targetUserUuid) {
        await User.updateOne(
            { uuid: userUuid },
            { $addToSet: { mutedUsers: targetUserUuid } }
        );
    }

    static async unmuteUser(userUuid, targetUserUuid) {
        await User.updateOne(
            { uuid: userUuid },
            { $pull: { mutedUsers: targetUserUuid } }
        );
    }

    static async blockUser(userUuid, targetUserUuid) {
        await User.updateOne(
            { uuid: userUuid },
            { $addToSet: { blockedUsers: targetUserUuid } }
        );
    }

    static async unblockUser(userUuid, targetUserUuid) {
        await User.updateOne(
            { uuid: userUuid },
            { $pull: { blockedUsers: targetUserUuid } }
        );
    }

    static async getMutedUsers(userUuid) {
        const user = await User.findOne({ uuid: userUuid });
        return user ? user.mutedUsers : [];
    }

    static async getBlockedUsers(userUuid) {
        const user = await User.findOne({ uuid: userUuid });
        return user ? user.blockedUsers : [];
    }

    // TODO: Game Session Integration
    // - Implement addActiveGame(userUuid, gameUuid) to track user's active games
    // - Implement removeActiveGame(userUuid, gameUuid) when game ends
    // - Add getActiveGames(userUuid) to fetch user's current games
    // - Add validation to prevent joining multiple games
    // - Consider game state persistence for reconnects

    // Admin methods
    static async getActiveUsers({ page = 1, limit = 50, filter = {} }) {
        const query = { ...filter };
        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return users.map(user => this.sanitizeUser(user));
    }

    static async banUser(userUuid, reason, duration) {
        const banExpiry = duration ? new Date(Date.now() + duration) : null;
        
        await User.updateOne(
            { uuid: userUuid },
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

    static async unbanUser(userUuid) {
        await User.updateOne(
            { uuid: userUuid },
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
    static sanitizeUser(user) {
        const sanitized = { ...user.toObject() };
        delete sanitized.password;
        delete sanitized._id;
        delete sanitized.__v;
        return sanitized;
    }

    static async sendVerificationEmail(user) {
        // Generate verification token
        const verificationToken = UuidService.generate();
        
        // Store the verification token
        await User.updateOne(
            { uuid: user.uuid },
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

    static async verifyEmail(token) {
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            throw new ValidationError('Invalid or expired verification token');
        }

        await User.updateOne(
            { uuid: user.uuid },
            { 
                $set: { 
                    verified: true,
                    verificationToken: null,
                    verificationTokenExpiry: null,
                    updatedAt: new Date()
                }
            }
        );

        return this.sanitizeUser(user);
    }
}

export default UserService;