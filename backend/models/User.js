import bcrypt from 'bcryptjs';
import { db } from '../database/database.js';
import { createUserUuid } from '../constants/GameUuids.js';
import DateService from '../services/DateService.js';
import crypto from 'crypto';

// Service Layer: User Representation
class User {
    constructor(data = {}) {
        this.userUuid = data.userUuid || createUserUuid();
        this.username = data.username;
        this.nickname = data.nickname || data.username;
        this.email = data.email;
        this.password = data.password;
        this.createdAt = data.createdAt || DateService.now();
        this.lastLoginAt = data.lastLoginAt || null;
        this.isAdmin = data.isAdmin || false;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.isDeleted = data.isDeleted || false;
        this.isBanned = data.isBanned || false;
        this.isVerified = data.isVerified || false;
        this.verificationToken = data.verificationToken || null;
        this.verificationExpires = data.verificationExpires || null;
        this.banReason = data.banReason || null;
        this.banExpiresAt = data.banExpiresAt || null;
        this.preferences = data.preferences || {};
    }

    static schema = {
        userUuid: { type: 'string', required: true },
        username: { type: 'string', required: true },
        nickname: { type: 'string', required: true },
        email: { type: 'string', required: true },
        password: { type: 'string', required: true },
        createdAt: { type: 'date', required: true },
        lastLoginAt: { type: 'date', required: false },
        isAdmin: { type: 'boolean', default: false },
        isActive: { type: 'boolean', default: true },
        isDeleted: { type: 'boolean', default: false },
        isBanned: { type: 'boolean', default: false },
        isVerified: { type: 'boolean', default: false },
        verificationToken: { type: 'string', required: false },
        verificationExpires: { type: 'date', required: false },
        banReason: { type: 'string', required: false },
        banExpiresAt: { type: 'date', required: false },
        preferences: { type: 'object', default: {} }
    };

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
            preferences: this.preferences
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
    collection: { modelName: 'users', schema: User.schema },

    async create(userData) {
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = DateService.addDuration(DateService.now(), { hours: 24 });

        const user = new User({
            ...userData,
            verificationToken,
            verificationExpires
        });

        const engine = db.getEngine();
        return await engine.create(this.collection, user.toJSON());
    },

    async findAll() {
        const engine = db.getEngine();
        return await engine.find(this.collection, {});
    },

    async findOne(query) {
        const engine = db.getEngine();
        return await engine.findOne(this.collection, query);
    },

    async findById(userUuid) {
        return await this.findOne({ userUuid });
    },

    async findActive() {
        const engine = db.getEngine();
        return await engine.find(this.collection, {
            isActive: true,
            isDeleted: false,
            isBanned: false,
            isVerified: true
        });
    },

    async delete(query) {
        const engine = db.getEngine();
        return await engine.update(this.collection, query, { isDeleted: true });
    },

    async permanentDelete(query) {
        const engine = db.getEngine();
        return await engine.delete(this.collection, query);
    },

    async update(query, updateData) {
        const engine = db.getEngine();
        return await engine.update(this.collection, query, updateData);
    },

    async findByCredentials(username, password) {
        const engine = db.getEngine();
        const user = await engine.findOne(this.collection, { 
            username,
            isDeleted: false,
            isActive: true,
            isVerified: true
        });
        
        if (!user) return null;
        if (!user.password) return null;
        if (user.isBanned && (!user.banExpiresAt || user.banExpiresAt > DateService.now())) {
            return null;
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        return isMatch ? user : null;
    },

    async updateLastLogin(userUuid) {
        return await this.update(
            { userUuid },
            { lastLoginAt: DateService.now() }
        );
    },

    async updatePreferences(userUuid, preferences) {
        return await this.update(
            { userUuid },
            { preferences }
        );
    },

    async ban(userUuid, reason, duration = null) {
        const banData = {
            isBanned: true,
            banReason: reason,
            banExpiresAt: duration ? DateService.addDuration(DateService.now(), duration) : null
        };
        return await this.update({ userUuid }, banData);
    },

    async unban(userUuid) {
        return await this.update(
            { userUuid },
            {
                isBanned: false,
                banReason: null,
                banExpiresAt: null
            }
        );
    },

    async verify(token) {
        const engine = db.getEngine();
        const user = await engine.findOne(this.collection, {
            verificationToken: token,
            verificationExpires: { $gt: DateService.now() }
        });

        if (!user) return null;

        await this.update(
            { userUuid: user.userUuid },
            {
                isVerified: true,
                verificationToken: null,
                verificationExpires: null
            }
        );

        return user;
    },

    async resendVerification(userUuid) {
        const user = await this.findById(userUuid);
        if (!user || user.isVerified) return null;

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = DateService.addDuration(DateService.now(), { hours: 24 });

        await this.update(
            { userUuid },
            {
                verificationToken,
                verificationExpires
            }
        );

        return { verificationToken };
    }
};

export default User;