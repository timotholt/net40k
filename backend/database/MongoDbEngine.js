import { BaseDbEngine } from './BaseDbEngine.js';
import { MongoClient } from 'mongodb';
import logger from '../utils/logger.js';
import { UuidService } from '../services/UuidService.js';
import DateService from '../services/DateService.js';

export class MongoDbEngine extends BaseDbEngine {
    constructor() {
        super();
        this.client = null;
        this.db = null;
        this.connectionPromise = null;
        this.initialized = false;
        this.supportsExplicitIndexes = true;
    }

    isConnected() {
        return !!(this.client && this.db && this.client.topology && this.client.topology.isConnected());
    }

    async connect() {
        try {
            if (!this.client) {
                this.client = new MongoClient(process.env.MONGODB_URI);
                this.connectionPromise = this.client.connect();
            }
            await this.connectionPromise;
            this.db = this.client.db(process.env.MONGODB_DATABASE);
            this.initialized = true;
            logger.info('Successfully connected to MongoDB');
            return true;
        } catch (error) {
            logger.error('MongoDbEngine: Connection failed:', error);
            this.initialized = false;
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
            logger.info('Disconnecting from MongoDB...');
            await this.client.close();
            this.client = null;
            this.db = null;
            this.connectionPromise = null;
            this.initialized = false;
            logger.info('Disconnected from MongoDB');
        }
    }

    async find(collection, query) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Find:', { collection, query });
        const result = await db.collection(collection.toLowerCase()).find(query).toArray();
        
        // Remove _id from results and normalize dates
        const cleanResults = result.map(doc => {
            const { _id, ...cleanDoc } = doc;
            return this._normalizeDates(cleanDoc);
        });
        
        return {
            sort: (sortCriteria) => {
                if (typeof sortCriteria === 'function') {
                    cleanResults.sort(sortCriteria);
                    return {
                        limit: (n) => cleanResults.slice(0, n)
                    };
                }
                return cleanResults.sort((a, b) => {
                    const [field, order] = Object.entries(sortCriteria)[0];
                    if (order === -1) {
                        return b[field] - a[field];
                    }
                    return a[field] - b[field];
                });
            },
            limit: (n) => cleanResults.slice(0, n),
            then: (resolve) => resolve(cleanResults)
        };
    }

    async findOne(collection, query) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB FindOne:', { collection, query });
        const doc = await db.collection(collection.toLowerCase()).findOne(query);
        if (!doc) return null;
        
        // Remove _id from result and normalize dates
        const { _id, ...cleanDoc } = doc;
        return this._normalizeDates(cleanDoc);
    }

    async create(collection, data) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        // Make a copy of the data to avoid modifying the input
        const docToInsert = { ...data };

        // Generate _id if not provided
        if (!docToInsert._id) {
            docToInsert._id = UuidService.generate();
        }

        // Ensure UUID is generated if not provided
        if (!docToInsert.uuid) {
            docToInsert.uuid = UuidService.generate();
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Insert:', { collection, data });
        const normalizedData = this._normalizeDates(docToInsert);
        await db.collection(collection.toLowerCase()).insertOne(normalizedData);
        const { _id, ...cleanData } = normalizedData;
        return cleanData;
    }

    async update(collection, query, data) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Update - Before:', { collection, query, data });
        
        // If data has _id, it's a document replacement
        if (data._id) {
            // Remove _id from update data to avoid MongoDB error
            const { _id, ...updateData } = data;
            const result = await db.collection(collection.toLowerCase()).replaceOne(
                query,
                { _id, ...updateData }
            );
            logger.debug('MongoDB Full Replace Result:', result);
            return { modifiedCount: result.modifiedCount };
        }
        
        // For partial updates, use $set to only update specified fields
        const result = await db.collection(collection.toLowerCase()).updateOne(
            query,
            { $set: data }
        );
        
        // Verify the update
        const updated = await db.collection(collection.toLowerCase()).findOne(query);
        logger.debug('MongoDB Update Result:', { result, updated });
        
        return { modifiedCount: result.modifiedCount };
    }

    async delete(collection, query) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Delete:', { collection, query });
        const result = await db.collection(collection.toLowerCase()).deleteMany(query);
        return { deletedCount: result.deletedCount };
    }

    async deleteCollection(collection) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.warn('MongoDB Delete Collection:', collection);
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
        logger.warn('MongoDB Clear Collection:', collection);
        return await db.collection(collection.toLowerCase()).deleteMany({});
    }

    async count(collection, query = {}) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Count:', { collection, query });
        return await db.collection(collection.toLowerCase()).countDocuments(query);
    }

    async aggregate(collection, pipeline) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Aggregate:', { collection, pipeline });
        return await db.collection(collection.toLowerCase()).aggregate(pipeline).toArray();
    }

    async findByUuid(collection, uuid) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB FindByUuid:', { collection, uuid });
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

    async createCollection(collection) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Create Collection:', collection);
        await db.createCollection(collection.toLowerCase());
    }

    async createIndex(collection, fields, options = {}) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB Create Index:', { collection, fields, options });
        await db.collection(collection.toLowerCase()).createIndex(fields, options);
    }

    async listIndexes(collection) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }

        const db = await this._ensureConnected();
        logger.debug('MongoDB List Indexes:', collection);
        const indexes = await db.collection(collection.toLowerCase()).indexes();
        return indexes.map(index => ({
            name: index.name,
            fields: index.key,
            unique: !!index.unique,
            sparse: !!index.sparse
        }));
    }

    _normalizeDates(data) {
        if (!data) return data;

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this._normalizeDates(item));
        }

        // Handle Date objects
        if (data instanceof Date) {
            return data;
        }

        // If not an object, return as is
        if (typeof data !== 'object') {
            return data;
        }

        const result = {};
        for (const [key, value] of Object.entries(data)) {
            if (!value) {
                result[key] = value;
                continue;
            }

            // Convert any date-like objects to proper Date instances
            if (value instanceof Date) {
                result[key] = value;
            } else if (typeof value === 'object' && value.$date) {
                // Handle MongoDB extended JSON format
                result[key] = new Date(value.$date);
            } else if (Array.isArray(value)) {
                result[key] = value.map(item => this._normalizeDates(item));
            } else if (typeof value === 'object') {
                result[key] = this._normalizeDates(value);
            } else {
                result[key] = value;
            }
        }

        return result;
    }
}