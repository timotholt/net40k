import { BaseDbEngine } from './BaseDbEngine.js';
import { MongoClient } from 'mongodb';
import { UuidService } from '../services/UuidService.js';
import DateService from '../services/DateService.js';

export class MongoDbEngine extends BaseDbEngine {
    constructor() {
        super();
        this.client = null;
        this.db = null;
        this.connectionPromise = null;
    }

    async connect() {
        try {
            if (!this.client) {
                this.client = new MongoClient(process.env.MONGODB_URI);
                this.connectionPromise = this.client.connect();
            }
            await this.connectionPromise;
            this.db = this.client.db(process.env.MONGODB_DATABASE);
            return true;
        } catch (error) {
            console.error('MongoDbEngine: Connection failed:', error);
            throw error;
        }
    }

    async _ensureConnected() {
        if (!this.client || !this.db) {
            await this.connect();
        }
        return this.db;
    }

    async disconnect() {
        if (this.client) {
            console.log('Disconnecting from MongoDB...');
            await this.client.close();
            this.client = null;
            this.db = null;
            this.connectionPromise = null;
            console.log('Disconnected from MongoDB');
        }
    }

    async find(collection, query) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        const result = await db.collection(collection.toLowerCase()).find(query).toArray();
        return {
            sort: (sortCriteria) => {
                if (typeof sortCriteria === 'function') {
                    result.sort(sortCriteria);
                    return {
                        limit: (n) => result.slice(0, n)
                    };
                }
                return result.sort((a, b) => {
                    const [field, order] = Object.entries(sortCriteria)[0];
                    if (order === -1) {
                        return b[field] - a[field];
                    }
                    return a[field] - b[field];
                });
            },
            limit: (n) => result.slice(0, n),
            then: (resolve) => resolve(result)
        };
    }

    async findOne(collection, query) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        return await db.collection(collection.toLowerCase()).findOne(query);
    }

    async create(collection, data) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        // Use provided _id or generate one
        if (!data._id) {
            data._id = UuidService.generate();
        }

        // Ensure UUID is generated if not provided
        if (!data.uuid) {
            data.uuid = UuidService.generate();
        }

        const db = await this._ensureConnected();
        const result = await db.collection(collection.toLowerCase()).insertOne(data);
        return data;
    }

    async update(collection, query, data) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        
        // If data has _id, it's a document replacement
        if (data._id) {
            // Remove _id from update data to avoid MongoDB error
            const { _id, ...updateData } = data;
            const result = await db.collection(collection.toLowerCase()).replaceOne(
                query,
                { _id, ...updateData }
            );
            return { modifiedCount: result.modifiedCount };
        }
        
        // Otherwise, it's a partial update using $set
        const result = await db.collection(collection.toLowerCase()).updateOne(
            query,
            { $set: data }
        );
        
        return { modifiedCount: result.modifiedCount };
    }

    async delete(collection, query) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        const result = await db.collection(collection.toLowerCase()).deleteMany(query);
        return { deletedCount: result.deletedCount };
    }

    async deleteCollection(collection) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        const result = await db.collection(collection.toLowerCase()).drop().catch(err => {
            if (err.code === 26) { // Collection doesn't exist
                return true;
            }
            throw err;
        });
        return result;
    }

    async clear(collection) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        return await db.collection(collection.toLowerCase()).deleteMany({});
    }

    async count(collection, query = {}) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        return await db.collection(collection.toLowerCase()).countDocuments(query);
    }

    async aggregate(collection, pipeline) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        return await db.collection(collection.toLowerCase()).aggregate(pipeline).toArray();
    }

    async findByUuid(collection, uuid) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        return await db.collection(collection.toLowerCase()).findOne({ uuid });
    }

    async withTransaction(callback) {
        const db = await this._ensureConnected();
        const session = this.client.startSession();
        try {
            await session.withTransaction(callback);
        } finally {
            await session.endSession();
        }
    }

    _normalizeDates(data) {
        // TO DO: implement date normalization logic
        return data;
    }
}