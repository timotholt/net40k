import bcrypt from 'bcryptjs';
import { db } from '../database/database.js';
import { createUserUuid } from '../../shared/constants/GameUuids.js';
import DateService from '../services/DateService.js';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { ValidationError, DatabaseError, AuthError } from '../utils/errors.js';
import { isFeatureEnabled, noOpAsync } from '../config/features.js';
import { Lock } from './Lock.js';
import { generateSchema } from '../utils/schemaGenerator.js';
import { sanitizeInput } from '../utils/sanitizer.js';
import { PASSWORD_SALT_ROUNDS, VERIFICATION_TOKEN_EXPIRY } from '../config/constants.js';

// Service Layer: User Representation
class User {
    constructor(data = {}) {
        // Sanitize input data (except password)
        const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
            // Don't sanitize password to preserve special characters
            acc[key] = typeof value === 'string' && key !== 'password' ? sanitizeInput(value) : value;
            return acc;
        }, {});

        this.userUuid = sanitizedData.userUuid || createUserUuid();
        this.username = sanitizedData.username;
        this.nickname = sanitizedData.nickname || sanitizedData.username;
        this.email = sanitizedData.email;
        this.password = sanitizedData.password;
        this.createdAt = sanitizedData.createdAt || DateService.now().date;
        this.lastLoginAt = sanitizedData.lastLoginAt || null;
        this.isAdmin = sanitizedData.isAdmin || false;
        this.isActive = sanitizedData.isActive !== undefined ? sanitizedData.isActive : true;
        this.isDeleted = sanitizedData.isDeleted || false;
        this.isBanned = sanitizedData.isBanned || false;
        
        // Handle verification based on feature flag
        const emailVerificationEnabled = isFeatureEnabled('EMAIL_VERIFICATION');
        this.isVerified = emailVerificationEnabled ? (sanitizedData.isVerified || false) : true;
        
        // Only set verification token if email verification is enabled
        if (emailVerificationEnabled) {
            this.verificationToken = sanitizedData.verificationToken || crypto.randomBytes(32).toString('hex');
            this.verificationExpires = sanitizedData.verificationExpires || new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);
        } else {
            this.verificationToken = null;
            this.verificationExpires = null;
        }
        
        this.banReason = sanitizedData.banReason || null;
        this.banExpiresAt = sanitizedData.banExpiresAt || null;
        this.preferences = sanitizedData.preferences || {};
        this.lastModified = DateService.now().date;
        this.profilePicture = sanitizedData.profilePicture || null;
        this.bio = sanitizedData.bio || null;
        // Muted users configuration
        this.mutedUserUuids = sanitizedData.mutedUserUuids || [];
        // Blocked users configuration
        this.blockedUserUuids = sanitizedData.blockedUserUuids || [];

    }

    validate() {
        if (!this.username || typeof this.username !== 'string' || this.username.length < 3) {
            throw new ValidationError('Username must be at least 3 characters long');
        }
        
        // Only validate email if email verification is enabled
        if (isFeatureEnabled('EMAIL_VERIFICATION')) {
            if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
                throw new ValidationError('Invalid email format');
            }
        }
        
        if (this.password && this.password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long');
        }
    }

    // Generate schema using schemaGenerator
    static schema = generateSchema(new User(), {
        username: { type: 'string', required: true, unique: true, minLength: 3 },
        email: { type: 'string', required: true, unique: true },
        password: { type: 'string', required: true, minLength: 8 },
        lastModified: { type: 'date', required: true }
    });

    toJSON() {
        return this.toLargeUserJSON();
    }

    // NOT sent to clients. This is server side only
    toLargeUserJSON() {
        const data = {
            userUuid: this.userUuid,
            username: this.username,
            nickname: this.nickname,
            email: this.email,
            password: this.password,
            createdAt: this.createdAt,
            lastLoginAt: this.lastLoginAt,
            isAdmin: this.isAdmin,
            isActive: this.isActive,
            isDeleted: this.isDeleted,
            isBanned: this.isBanned,
            isVerified: this.isVerified,
            verificationToken: this.verificationToken,
            verificationExpires: this.verificationExpires,
            banReason: this.banReason,
            banExpiresAt: this.banExpiresAt,
            preferences: this.preferences,
            lastModified: this.lastModified,
            mutedUserUuids: this.mutedUserUuids,
            blockedUserUuids: this.blockedUserUuids,
        };

        // Remove undefined values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                data[key] = null;
            }
        });

        return data;
    }

    // New semantic serialization methods
    toPublicUser() {
        return {
            userUuid: this.userUuid,
            nickname: this.nickname,
            isAdmin: this.isAdmin || false,
            profilePicture: this.profilePicture,
            bio: this.bio
        };
    }

    toPrivateUser() {
        return {
            userUuid: this.userUuid,
            username: this.username,
            nickname: this.nickname,
            email: this.email,
            isAdmin: this.isAdmin,
            isActive: this.isActive,
            isVerified: this.isVerified,
            preferences: this.preferences || {},
            createdAt: this.createdAt,
            lastLoginAt: this.lastLoginAt,
            profilePicture: this.profilePicture,
            bio: this.bio,
            mutedUserUuids: this.mutedUserUuids,
            blockedUserUuids: this.blockedUserUuids
        };
    }

    toFullUser() {
        return this.toLargeUserJSON();
    }

    // Deprecated methods - will be removed in future versions
    /** @deprecated Use toPublicUser() instead */
    toSmallUser() {
        logger.warn('toSmallUser() is deprecated. Use toPublicUser() instead');
        return this.toPublicUser();
    }

    /** @deprecated Use toPrivateUser() instead */
    toMediumUser() {
        logger.warn('toMediumUser() is deprecated. Use toPrivateUser() instead');
        return this.toPrivateUser();
    }

    /** @deprecated Use toPublicUser() instead */
    toSmallUserJSON() {
        logger.warn('toSmallUserJSON() is deprecated. Use toPublicUser() instead');
        return this.toPublicUser();
    }

    /** @deprecated Use toPrivateUser() instead */
    toMediumUserJSON() {
        logger.warn('toMediumUserJSON() is deprecated. Use toPrivateUser() instead');
        return this.toPrivateUser();
    }
}

// Database Layer
export const UserDB = {
    collection: 'user',

    async init() {
        await db.createCollection(this.collection);
        
        // Only create indexes if the database engine supports them
        if (db.supportsExplicitIndexes) {
            // Create indexes for efficient lookups
            await db.createIndex(this.collection, { username: 1 }, { unique: true });
            await db.createIndex(this.collection, { email: 1 }, { unique: true, sparse: true });
            await db.createIndex(this.collection, { userUuid: 1 }, { unique: true });
        } else {
            logger.info('Database engine does not support explicit indexes, skipping index creation');
        }

        // Initialize system users
        try {
            const SystemUserService = await import('../services/SystemUserService.js');
            await SystemUserService.default.initializeSystemUsers();
        } catch (error) {
            logger.error('Failed to initialize system users:', error);
        }
    },

    async create(userData) {
        // Create composite lock ID for both username and email
        const lockId = userData.email 
            ? `user-create-${userData.username}-${userData.email}`
            : `user-create-${userData.username}`;
            
        try {
            // Acquire lock with shorter timeout since registration should be quick
            await Lock.acquire(lockId, 1000);
            logger.info(`Creating new user: ${userData.username}`);
            
            const user = new User(userData);
            user.validate();

            // Check for existing user
            const existingUser = await this.findOne({ 
                $or: [
                    { username: user.username },
                    ...(user.email ? [{ email: user.email }] : [])
                ] 
            });
            if (existingUser) {
                const field = existingUser.username === user.username ? 'username' : 'email';
                throw new ValidationError(`User with this ${field} already exists`);
            }

            // Hash password with proper salt rounds
            if (user.password) {
                user.password = await bcrypt.hash(user.password, PASSWORD_SALT_ROUNDS);
            }

            // Generate verification token
            user.verificationToken = crypto.randomBytes(32).toString('hex');
            user.verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

            const result = await db.create(this.collection, user.toJSON());
            logger.info(`User created successfully: ${user.username}`);
            return this._toUserInstance(result);
        } catch (error) {
            logger.error(`Failed to create user: ${error.message}`);
            throw error instanceof ValidationError ? error : new DatabaseError('Failed to create user');
        } finally {
            await Lock.release(lockId);
        }
    },

    async findAll() {
        try {
            const dbUsers = await db.find(this.collection, { isDeleted: false });
            return dbUsers.map(user => this._toUserInstance(user));
        } catch (error) {
            logger.error(`Failed to fetch users: ${error.message}`);
            throw new DatabaseError('Failed to fetch users');
        }
    },

    async findOne(query) {
        try {
            logger.debug(`Finding user with query: ${JSON.stringify(query)}`);
            const dbUser = await db.findOne(this.collection, query);
            return this._toUserInstance(dbUser);
        } catch (error) {
            logger.error(`Failed to find user: ${error.message}`);
            throw new DatabaseError('Failed to find user');
        }
    },

    async findById(userUuid) {
        try {
            logger.debug(`Finding user by UUID: ${userUuid}`);
            const dbUser = await db.findOne(this.collection, { userUuid, isDeleted: false });
            return this._toUserInstance(dbUser);
        } catch (error) {
            logger.error(`Failed to find user by UUID: ${error.message}`);
            throw new DatabaseError('Failed to find user');
        }
    },

    async findActive() {
        try {
            const dbUsers = await db.find(this.collection, { 
                isActive: true,
                isDeleted: false,
                isBanned: false
            });
            return dbUsers.map(user => this._toUserInstance(user));
        } catch (error) {
            logger.error(`Failed to fetch active users: ${error.message}`);
            throw new DatabaseError('Failed to fetch active users');
        }
    },

    async delete(query) {
        try {
            return await db.update(this.collection, query, { isDeleted: true });
        } catch (error) {
            logger.error(`Failed to delete user: ${error.message}`);
            throw new DatabaseError('Failed to delete user');
        }
    },

    async permanentDelete(query) {
        try {
            return await db.delete(this.collection, query);
        } catch (error) {
            logger.error(`Failed to permanently delete user: ${error.message}`);
            throw new DatabaseError('Failed to permanently delete user');
        }
    },

    async update(query, updateData) {
        try {
            // Validate update data
            if (updateData.password) {
                updateData.password = await bcrypt.hash(
                    updateData.password,
                    PASSWORD_SALT_ROUNDS
                );
            }

            // Add last modified timestamp - use just the date component for consistency
            updateData.lastModified = DateService.now().date;

            const result = await db.update(this.collection, query, updateData);
            return result;
        } catch (error) {
            logger.error(`Failed to update user: ${error.message}`);
            throw new DatabaseError('Failed to update user');
        }
    },

    _toUserInstance(dbObject) {
        if (!dbObject) return null;
        return new User(dbObject);
    },

    async findByCredentials(username, password) {
        try {
            logger.debug(`Attempting to find user with username: ${username}`);
            
            const dbUser = await this.findOne({ username, isDeleted: false });
            
            if (!dbUser) {
                logger.error(`No user found with username: ${username}`);
                throw new AuthError('Username not found');
            }

            // Convert to User instance
            const user = this._toUserInstance(dbUser);

            const isMatch = await bcrypt.compare(password, user.password);
            logger.debug(`Password match result: ${isMatch}`);

            if (!isMatch) {
                throw new AuthError('Invalid password');
            }

            if (user.isBanned) {
                if (user.banExpiresAt && user.banExpiresAt < new Date()) {
                    await this.unban(user.userUuid);
                } else {
                    throw new AuthError('Account is banned' + (user.banReason ? `: ${user.banReason}` : ''));
                }
            }

            // Skip verification check if feature is disabled
            if (isFeatureEnabled('EMAIL_VERIFICATION') && !user.isVerified) {
                throw new AuthError('Email not verified');
            }

            return user;
        } catch (error) {
            logger.error(`Login failed for user ${username}: ${error.message}`);
            throw error;
        }
    },

    async updateLastLogin(userUuid) {
        try {
            const now = DateService.now();
            return await this.update(
                { userUuid },
                { lastLoginAt: now.date }
            );
        } catch (error) {
            logger.error(`Failed to update last login: ${error.message}`);
            throw new DatabaseError('Failed to update last login time');
        }
    },

    async updatePreferences(userUuid, preferences) {
        try {
            return await this.update(
                { userUuid },
                { preferences }
            );
        } catch (error) {
            logger.error(`Failed to update preferences: ${error.message}`);
            throw new DatabaseError('Failed to update user preferences');
        }
    },

    async ban(userUuid, reason, duration = null) {
        try {
            const banData = {
                isBanned: true,
                banReason: reason,
                banExpiresAt: duration ? new Date(Date.now() + duration) : null
            };
            return await this.update({ userUuid }, banData);
        } catch (error) {
            logger.error(`Failed to ban user: ${error.message}`);
            throw new DatabaseError('Failed to ban user');
        }
    },

    async unban(userUuid) {
        try {
            const unbanData = {
                isBanned: false,
                banReason: null,
                banExpiresAt: null
            };
            return await this.update({ userUuid }, unbanData);
        } catch (error) {
            logger.error(`Failed to unban user: ${error.message}`);
            throw new DatabaseError('Failed to unban user');
        }
    },

    // Replace email verification methods with no-op when feature is disabled
    verify: isFeatureEnabled('EMAIL_VERIFICATION') 
        ? async function(token) {
            // Original verify implementation
            try {
                const user = await this.findOne({ 
                    verificationToken: token,
                    verificationExpires: { $gt: new Date() }
                });

                if (!user) {
                    throw new AuthError('Invalid or expired verification token');
                }

                await this.update(
                    { userUuid: user.userUuid },
                    { 
                        isVerified: true,
                        verificationToken: null,
                        verificationExpires: null
                    }
                );

                return true;
            } catch (error) {
                logger.error(`Verification failed: ${error.message}`);
                throw error;
            }
        }
        : noOpAsync,

    resendVerification: isFeatureEnabled('EMAIL_VERIFICATION')
        ? async function(userUuid) {
            // Original resendVerification implementation
            try {
                const user = await this.findById(userUuid);
                if (!user) {
                    throw new AuthError('User not found');
                }

                if (user.isVerified) {
                    throw new AuthError('User is already verified');
                }

                const verificationToken = crypto.randomBytes(32).toString('hex');
                const verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

                await this.update(
                    { userUuid },
                    { verificationToken, verificationExpires }
                );

                return { verificationToken };
            } catch (error) {
                logger.error(`Resend verification failed: ${error.message}`);
                throw error;
            }
        }
        : noOpAsync,
};

export default User;