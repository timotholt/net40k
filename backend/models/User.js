import mongoose from 'mongoose';
import { db } from '../database/database.js';
import { UuidService } from '../services/UuidService.js';
import DateService from '../services/DateService.js';

// Service Layer: User Representation
class User {
    constructor(data = {}) {
        this.userId = data.userId || UuidService.generate();
        this.username = data.username;
        this.nickname = data.nickname || data.username;
        this.password = data.password;
        this.isDeleted = data.isDeleted || false;
        this.deletedAt = data.deletedAt || null;
        this.createdAt = data.createdAt || DateService.now().date;
    }

    toJSON() {
        return {
            userId: this.userId,
            username: this.username,
            nickname: this.nickname,
            isDeleted: this.isDeleted,
            createdAt: this.createdAt
        };
    }

    // Optional: Add validation methods
    validate() {
        if (!this.username || this.username.length < 3 || this.username.length > 30) {
            throw new Error('Invalid username');
        }
        if (!this.password || this.password.length < 6) {
            throw new Error('Invalid password');
        }
        return true;
    }
}

// Database Layer Schema
const schemaDefinition = {
    _id: {
        type: String,
        default: UuidService.generate
    },
    userId: {
        type: String,
        required: true,
        unique: true,
        default: UuidService.generate
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    nickname: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 30
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: () => DateService.now().date
    }
};

export const UserDB = {
    _model: null,

    async init() {
        if (!this._model) {
            const schema = new mongoose.Schema(schemaDefinition);
            this._model = mongoose.model('User', schema);
        }
        return this._model;
    },

    async findById(userId) {
        const model = await this.init();
        const dbRecord = await db.getEngine().findOne(model, { userId });
        return dbRecord ? new User(dbRecord) : null;
    },

    async findOne(query) {
        const model = await this.init();
        const dbRecord = await db.getEngine().findOne(model, query);
        return dbRecord ? new User(dbRecord) : null;
    },

    async findAll() {
        const model = await this.init();
        const dbRecords = await db.getEngine().find(model, {});
        return dbRecords.map(record => new User(record));
    },

    async create(userData) {
        const model = await this.init();

        // Create service layer user
        const user = new User(userData);
        
        // Validate user data
        user.validate();

        // Create database record
        const dbRecord = await db.getEngine().create(model, {
            ...userData,
            userId: user.userId,
            isDeleted: false
        });
        
        return new User(dbRecord);
    },

    async update(query, data) {
        const model = await this.init();
        const updatedRecord = await db.getEngine().update(model, query, data);
        return updatedRecord ? new User(updatedRecord) : null;
    },

    async updateById(userId, data) {
        const model = await this.init();
        const updatedRecord = await db.getEngine().update(model, { userId }, data);
        return updatedRecord ? new User(updatedRecord) : null;
    },

    async softDelete(userId) {
        const model = await this.init();
        const updatedRecord = await db.getEngine().update(
            model, 
            { userId }, 
            { 
                isDeleted: true,
                deletedAt: DateService.now(),
                nickname: "Deleted User"
            }
        );
        return updatedRecord ? new User(updatedRecord) : null;
    },

    async delete(query) {
        const model = await this.init();
        return await db.getEngine().delete(model, query);
    },

    async deleteById(userId) {
        const model = await this.init();
        return await db.getEngine().delete(model, { userId });
    },

    async findActive(query) {
        const model = await this.init();
        const dbRecords = await db.getEngine().find(model, {
            ...query,
            isDeleted: { $ne: true }
        });
        return dbRecords.map(record => new User(record));
    },

    async findOneActive(query) {
        const model = await this.init();
        const dbRecord = await db.getEngine().findOne(model, {
            ...query,
            isDeleted: false
        });
        return dbRecord ? new User(dbRecord) : null;
    },

    async findByUsername(username) {
        const model = await this.init();
        const dbRecord = await db.getEngine().findOne(model, { username });
        return dbRecord ? new User(dbRecord) : null;
    }
};