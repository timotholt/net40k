import mongoose from 'mongoose';
import { db } from '../database/database.js';
import crypto from 'crypto';

// Schema definition (but not initialization)
const schemaDefinition = {
  userId: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomUUID()
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
    maxlength: 30,
    default: function() {
      return this.username;
    }
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
};

// Firestore schema metadata
const firestoreSchema = {
  userId: { type: 'string', required: true },
  username: { type: 'string', required: true },
  nickname: { type: 'string', required: true },
  password: { type: 'string', required: true },
  deleted: { type: 'boolean', default: false },
  deletedAt: { type: 'date', default: null },
  createdAt: { type: 'date', default: () => new Date() }
};

let User;

export const UserDB = {
  async init() {
    if (!User) {
      const schema = new mongoose.Schema(schemaDefinition);
      User = mongoose.model('User', schema);
      User.schema = firestoreSchema;
    }
    return User;
  },

  async findById(userId) {
    const model = await this.init();
    return await db.getEngine().findOne(model, { userId });
  },

  async findOne(query) {
    const model = await this.init();
    return await db.getEngine().findOne(model, query);
  },

  async findAll() {
    const model = await this.init();
    return await db.getEngine().find(model, {});
  },

  async create(userData) {
    const model = await this.init();
    
    // Ensure userId is generated if not provided
    if (!userData.userId) {
      userData.userId = crypto.randomUUID();
    }

    // Ensure deleted is set to false
    userData.deleted = false;
    
    return await db.getEngine().create(model, userData);
  },

  async update(query, data) {
    const model = await this.init();
    return await db.getEngine().update(model, query, data);
  },

  async updateById(userId, data) {
    const model = await this.init();
    return await db.getEngine().update(model, { userId }, data);
  },

  async softDelete(userId) {
    const model = await this.init();
    return await db.getEngine().update(model, 
      { userId }, 
      { 
        deleted: true,
        deletedAt: new Date(),
        nickname: "Deleted User"
      }
    );
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
    return await db.getEngine().find(model, {
      ...query,
      deleted: { $ne: true }
    });
  },

  async findOneActive(query) {
    const model = await this.init();
    return await db.getEngine().findOne(model, {
      ...query,
      deleted: false
    });
  },

  async findByUsername(username) {
    const model = await this.init();
    return await db.getEngine().findOne(model, { username });
  }
};