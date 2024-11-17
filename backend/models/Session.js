import { Schema } from 'mongoose';
import { database } from '../utils/database.js';

const sessionSchema = new Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userUuid: {
        type: String,
        required: true,
        index: true
    },
    deviceInfo: {
        deviceId: String,
        deviceName: String,
        deviceType: String,
        pushToken: String,
        ip: String,
        userAgent: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 24 * 60 * 60 // TTL index: automatically remove documents after 24 hours
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

// Update lastActive timestamp on each session access
sessionSchema.methods.touch = async function() {
    this.lastActive = new Date();
    await this.save();
};

// Static methods for session management
sessionSchema.statics.createSession = async function(userUuid, deviceInfo = {}) {
    const session = await this.create({
        token: database.generateUuid(),
        userUuid,
        deviceInfo,
        createdAt: new Date(),
        lastActive: new Date()
    });
    return session;
};

sessionSchema.statics.findByToken = async function(token) {
    const session = await this.findOne({ token });
    if (session) {
        await session.touch();
    }
    return session;
};

sessionSchema.statics.terminateSession = async function(token) {
    return this.deleteOne({ token });
};

sessionSchema.statics.terminateUserSessions = async function(userUuid, exceptToken = null) {
    const query = { userUuid };
    if (exceptToken) {
        query.token = { $ne: exceptToken };
    }
    return this.deleteMany(query);
};

sessionSchema.statics.getUserSessions = async function(userUuid) {
    return this.find({ userUuid }).sort({ lastActive: -1 });
};

// Create TTL index for automatic session cleanup
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const Session = database.model('Session', sessionSchema);
