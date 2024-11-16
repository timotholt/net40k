import bcrypt from 'bcryptjs';
import { db } from '../database/database.js';
import { createUserUuid } from '../constants/GameUuids.js';
import DateService from '../services/DateService.js';
import crypto from 'crypto';
import { generateSchema } from '../utils/schemaGenerator.js';
import logger from '../utils/logger.js';
import { sanitizeInput } from '../utils/sanitizer.js';
import { ValidationError, DatabaseError, AuthError } from '../utils/errors.js';
import { Lock } from './Lock.js';
import { PASSWORD_SALT_ROUNDS, VERIFICATION_TOKEN_EXPIRY } from '../config/constants.js';

// Service Layer: User Representation
class User {
    constructor(data = {}) {
        // Sanitize input data
        const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
            return acc;
        }, {});

        this.userUuid = sanitizedData.userUuid || createUserUuid();
        this.username = sanitizedData.username;
        this.nickname = sanitizedData.nickname || sanitizedData.username;
        this.email = sanitizedData.email;
        this.password = sanitizedData.password;
        this.createdAt = sanitizedData.createdAt || DateService.now();
        this.lastLoginAt = sanitizedData.lastLoginAt || null;
        this.isAdmin = sanitizedData.isAdmin || false;
        this.isActive = sanitizedData.isActive !== undefined ? sanitizedData.isActive : true;
        this.isDeleted = sanitizedData.isDeleted || false;
        this.isBanned = sanitizedData.isBanned || false;
        this.isVerified = sanitizedData.isVerified || false;
        this.verificationToken = sanitizedData.verificationToken || null;
        this.verificationExpires = sanitizedData.verificationExpires || null;
        this.banReason = sanitizedData.banReason || null;
        this.banExpiresAt = sanitizedData.banExpiresAt || null;
        this.preferences = sanitizedData.preferences || {};
        this.lastModified = DateService.now();
    }

    validate() {
        if (!this.username || typeof this.username !== 'string' || this.username.length < 3) {
            throw new ValidationError('Username must be at least 3 characters long');
        }
        if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            throw new ValidationError('Invalid email format');
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
            lastModified: this.lastModified
        };

        // Remove undefined values
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                data[key] = null;
            }
        });

        return data;
    }

    toPublicJSON() {
        return {
            userUuid: this.userUuid,
            username: this.username,
            nickname: this.nickname,
            isAdmin: this.isAdmin,
            isActive: this.isActive,
            isBanned: this.isBanned,
            isVerified: this.isVerified
        };
    }
}

// Database Layer
export const UserDB = {
    collection: 'user',

    async create(userData) {
        const lockId = `user-create-${userData.email}`;
        try {
            await Lock.acquire(lockId);
            logger.info(`Creating new user: ${userData.email}`);
            
            const user = new User(userData);
            user.validate();

            // Check for existing user
            const existingUser = await this.findOne({ 
                $or: [{ email: user.email }, { username: user.username }] 
            });
            if (existingUser) {
                throw new ValidationError('User with this email or username already exists');
            }

            // Hash password with proper salt rounds
            if (user.password) {
                user.password = await bcrypt.hash(user.password, PASSWORD_SALT_ROUNDS);
            }

            // Generate verification token
            user.verificationToken = crypto.randomBytes(32).toString('hex');
            user.verificationExpires = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

            const result = await db.getEngine().create(this.collection, user.toJSON());
            logger.info(`User created successfully: ${user.email}`);
            return result;
        } catch (error) {
            logger.error(`Failed to create user: ${error.message}`);
            throw error instanceof ValidationError ? error : new DatabaseError('Failed to create user');
        } finally {
            await Lock.release(lockId);
        }
    },

    async findAll() {
        try {
            logger.debug('Fetching all users');
            return await db.getEngine().find(this.collection, { isDeleted: false });
        } catch (error) {
            logger.error(`Failed to fetch users: ${error.message}`);
            throw new DatabaseError('Failed to fetch users');
        }
    },

    async findOne(query) {
        try {
            logger.debug(`Finding user with query: ${JSON.stringify(query)}`);
            return await db.getEngine().findOne(this.collection, query);
        } catch (error) {
            logger.error(`Failed to find user: ${error.message}`);
            throw new DatabaseError('Failed to find user');
        }
    },

    async findById(userUuid) {
        try {
            logger.debug(`Finding user by UUID: ${userUuid}`);
            return await db.getEngine().findOne(this.collection, { userUuid, isDeleted: false });
        } catch (error) {
            logger.error(`Failed to find user by ID: ${error.message}`);
            throw new DatabaseError('Failed to find user');
        }
    },

    async findActive() {
        try {
            logger.debug('Finding active users');
            return await db.getEngine().find(this.collection, {
                isActive: true,
                isDeleted: false,
                isBanned: false,
                isVerified: true
            });
        } catch (error) {
            logger.error(`Failed to find active users: ${error.message}`);
            throw new DatabaseError('Failed to find active users');
        }
    },

    async delete(query) {
        try {
            logger.info(`Deleting user with query: ${JSON.stringify(query)}`);
            return await db.getEngine().update(this.collection, query, { isDeleted: true });
        } catch (error) {
            logger.error(`Failed to delete user: ${error.message}`);
            throw new DatabaseError('Failed to delete user');
        }
    },

    async permanentDelete(query) {
        try {
            logger.info(`Permanently deleting user with query: ${JSON.stringify(query)}`);
            return await db.getEngine().delete(this.collection, query);
        } catch (error) {
            logger.error(`Failed to permanently delete user: ${error.message}`);
            throw new DatabaseError('Failed to permanently delete user');
        }
    },

    async update(query, updateData) {
        const lockId = `user-update-${query.userUuid || query._id}`;
        try {
            await Lock.acquire(lockId);
            logger.info(`Updating user: ${JSON.stringify(query)}`);
            
            // Sanitize update data
            const sanitizedData = Object.entries(updateData).reduce((acc, [key, value]) => {
                acc[key] = typeof value === 'string' ? sanitizeInput(value) : value;
                return acc;
            }, {});

            // Add last modified timestamp
            sanitizedData.lastModified = DateService.now();

            // Hash password if it's being updated
            if (sanitizedData.password) {
                sanitizedData.password = await bcrypt.hash(sanitizedData.password, PASSWORD_SALT_ROUNDS);
            }

            const result = await db.getEngine().update(this.collection, query, sanitizedData);
            logger.info(`User updated successfully`);
            return result;
        } catch (error) {
            logger.error(`Failed to update user: ${error.message}`);
            throw new DatabaseError('Failed to update user');
        } finally {
            await Lock.release(lockId);
        }
    },

    async findByCredentials(username, password) {
        try {
            logger.debug(`Attempting login for user: ${username}`);
            const user = await this.findOne({ 
                username, 
                isDeleted: false,
                isActive: true,
                isBanned: false
            });

            if (!user) {
                throw new AuthError('Invalid credentials');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                logger.warn(`Failed login attempt for user: ${username}`);
                throw new AuthError('Invalid credentials');
            }

            return user;
        } catch (error) {
            logger.error(`Login failed: ${error.message}`);
            throw error instanceof AuthError ? error : new DatabaseError('Authentication failed');
        }
    },

    async updateLastLogin(userUuid) {
        try {
            logger.info(`Updating last login for user: ${userUuid}`);
            return await this.update(
                { userUuid },
                { lastLoginAt: DateService.now() }
            );
        } catch (error) {
            logger.error(`Failed to update last login: ${error.message}`);
            throw new DatabaseError('Failed to update last login');
        }
    },

    async updatePreferences(userUuid, preferences) {
        try {
            logger.info(`Updating preferences for user: ${userUuid}`);
            return await this.update(
                { userUuid },
                { preferences }
            );
        } catch (error) {
            logger.error(`Failed to update preferences: ${error.message}`);
            throw new DatabaseError('Failed to update preferences');
        }
    },

    async ban(userUuid, reason, duration = null) {
        try {
            logger.info(`Banning user: ${userUuid}`);
            const banData = {
                isBanned: true,
                banReason: reason,
                banExpiresAt: duration ? DateService.addDuration(DateService.now(), duration) : null
            };
            return await this.update({ userUuid }, banData);
        } catch (error) {
            logger.error(`Failed to ban user: ${error.message}`);
            throw new DatabaseError('Failed to ban user');
        }
    },

    async unban(userUuid) {
        try {
            logger.info(`Unbanning user: ${userUuid}`);
            return await this.update(
                { userUuid },
                {
                    isBanned: false,
                    banReason: null,
                    banExpiresAt: null
                }
            );
        } catch (error) {
            logger.error(`Failed to unban user: ${error.message}`);
            throw new DatabaseError('Failed to unban user');
        }
    },

    async verify(token) {
        try {
            logger.info(`Verifying user with token: ${token}`);
            const user = await db.getEngine().findOne(this.collection, {
                verificationToken: token,
                verificationExpires: { $gt: DateService.now() }
            });

            if (!user) {
                throw new AuthError('Invalid verification token');
            }

            await db.getEngine().update(
                this.collection,
                { userUuid: user.userUuid },
                {
                    isVerified: true,
                    verificationToken: null,
                    verificationExpires: null
                }
            );

            return user;
        } catch (error) {
            logger.error(`Verification failed: ${error.message}`);
            throw error instanceof AuthError ? error : new DatabaseError('Verification failed');
        }
    },

    async resendVerification(userUuid) {
        try {
            logger.info(`Resending verification for user: ${userUuid}`);
            const user = await db.getEngine().findOne(this.collection, { userUuid });
            if (!user || user.isVerified) {
                throw new AuthError('User is already verified');
            }

            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationExpires = DateService.addDuration(DateService.now(), { hours: 24 });

            await db.getEngine().update(
                this.collection,
                { userUuid },
                {
                    verificationToken,
                    verificationExpires
                }
            );

            return { verificationToken };
        } catch (error) {
            logger.error(`Failed to resend verification: ${error.message}`);
            throw error instanceof AuthError ? error : new DatabaseError('Failed to resend verification');
        }
    }
};

export default User;