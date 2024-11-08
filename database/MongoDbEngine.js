import { BaseDbEngine } from './BaseDbEngine.js';
import { MongoClient } from 'mongodb';

export class MongoDbEngine extends BaseDbEngine {
    constructor() {
        super();
        this.client = null;
        this.db = null;
    }

    async connect() {
        try {
        console.log('Attempting to connect to MongoDB...');
        this.client = new MongoClient(process.env.MONGODB_URI);
        await this.client.connect();
        this.db = this.client.db();

        // Test connection
        await this.db.command({ ping: 1 });
        console.log('Connected to MongoDB');
        
        return this.client;
        } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
        }
    }

    async isHealthy() {
        try {
        if (!this.client || !this.db) return false;
        await this.db.command({ ping: 1 });
        return true;
        } catch (error) {
        console.error('MongoDB health check failed:', error);
        return false;
        }
    }

    async find(collection, query) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        const result = await this.db.collection(collectionName).find(query).toArray();

        return {
        sort: (sortCriteria) => {
            if (typeof sortCriteria === 'function') {
            result.sort(sortCriteria);
            } else {
            const [field, order] = Object.entries(sortCriteria)[0];
            result.sort((a, b) => order * (a[field] > b[field] ? 1 : -1));
            }
            return {
            limit: (n) => result.slice(0, n)
            };
        },
        limit: (n) => result.slice(0, n),
        then: (resolve) => resolve(result)
        };
    }

    async findOne(collection, query) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        return await this.db.collection(collectionName).findOne(query);
    }

    async create(collection, data) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        // If an _id is not provided, make one from a UUID
        if (!data._id) {
            data._id = crypto.randomUUID();
        }

        const collectionName = collection.modelName.toLowerCase();
        const result = await this.db.collection(collectionName).insertOne(data);
        return { ...data, _id: result.insertedId };
    }

    async update(collection, query, data) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        const result = await this.db.collection(collectionName).updateMany(query, { $set: data });
        return { modifiedCount: result.modifiedCount };
    }

    async delete(collection, query) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        const result = await this.db.collection(collectionName).deleteOne(query);
        return { deletedCount: result.deletedCount };
    }

    async clear(collection) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        return await this.db.collection(collectionName).deleteMany({});
    }

    async count(collection, query = {}) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        return await this.db.collection(collectionName).countDocuments(query);
    }

    async aggregate(collection, pipeline) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const collectionName = collection.modelName.toLowerCase();
        return await this.db.collection(collectionName).aggregate(pipeline).toArray();
    }

    async withTransaction(callback) {
        if (!await this.isHealthy()) {
        throw new Error('Database connection is not healthy');
        }

        const session = this.client.startSession();
        try {
        await session.withTransaction(callback);
        } finally {
        await session.endSession();
        }
    }
}