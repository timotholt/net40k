import { getDbEngine } from './selectDbEngine.js';

class Database {
    #dbEngine;
    #initialized;
    static instance = null;

    constructor() {
        if (Database.instance) {
            return Database.instance;
        }
        this.#dbEngine = null;
        this.#initialized = false;
        Database.instance = this;
    }

    isConnected() {
        return this.#initialized && this.#dbEngine?.initialized;
    }

    async init() {
        if (this.isConnected()) {
            console.log('Database: Already initialized and connected');
            return this;
        }

        try {
            const dbType = process.env.DB_TYPE || 'memory';
            console.log(`Database: Initializing ${dbType} database`);
            
            // Create new engine instance if none exists
            if (!this.#dbEngine) {
                this.#dbEngine = getDbEngine(dbType);
                if (!this.#dbEngine) {
                    throw new Error(`Failed to create database engine for type: ${dbType}`);
                }
            }
            
            // Connect to the database
            const connected = await this.#dbEngine.connect();
            if (!connected) {
                throw new Error('Database engine failed to connect');
            }

            this.#initialized = true;
            console.log('Database: Successfully initialized and connected');
            return this;
        } catch (error) {
            console.error('Database: Initialization failed:', error);
            this.#initialized = false;
            this.#dbEngine = null;
            throw error;
        }
    }

    async ensureConnection() {
        if (!this.isConnected()) {
            await this.init();
        }
    }

    async find(collection, query, options = {}) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Finding in ${collection}:`, { query, options });
            let result = await this.#dbEngine.find(collection, query);
            
            // Handle sorting
            if (options.sort && Array.isArray(result)) {
                const [field, order] = Object.entries(options.sort)[0];
                result = result.sort((a, b) => {
                    return order === -1 ? b[field] - a[field] : a[field] - b[field];
                });
            }
            
            // Handle limit
            if (options.limit && Array.isArray(result)) {
                result = result.slice(0, options.limit);
            }
            
            return result;
        } catch (error) {
            console.error(`Database: Find operation failed in ${collection}:`, error);
            throw error;
        }
    }

    async findOne(collection, query) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Finding one in ${collection}:`, query);
            return await this.#dbEngine.findOne(collection, query);
        } catch (error) {
            console.error(`Database: FindOne operation failed in ${collection}:`, error);
            throw error;
        }
    }

    async create(collection, data) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Creating in ${collection}:`, data);
            return await this.#dbEngine.create(collection, data);
        } catch (error) {
            console.error(`Database: Create operation failed in ${collection}:`, error);
            throw error;
        }
    }

    async update(collection, query, data) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Updating in ${collection}:`, { query, data });
            return await this.#dbEngine.update(collection, query, data);
        } catch (error) {
            console.error(`Database: Update operation failed in ${collection}:`, error);
            throw error;
        }
    }

    async delete(collection, query) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Deleting in ${collection}:`, query);
            return await this.#dbEngine.delete(collection, query);
        } catch (error) {
            console.error(`Database: Delete operation failed in ${collection}:`, error);
            throw error;
        }
    }

    async deleteCollection(collection) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Deleting collection: ${collection}`);
            return await this.#dbEngine.deleteCollection(collection);
        } catch (error) {
            console.error(`Database: DeleteCollection operation failed:`, error);
            throw error;
        }
    }

    async createCollection(collection) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Creating collection: ${collection}`);
            return await this.#dbEngine.createCollection(collection);
        } catch (error) {
            console.error(`Database: CreateCollection operation failed:`, error);
            throw error;
        }
    }

    async createIndex(collection, fields, options = {}) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Creating index on ${collection}:`, { fields, options });
            return await this.#dbEngine.createIndex(collection, fields, options);
        } catch (error) {
            console.error(`Database: CreateIndex operation failed:`, error);
            throw error;
        }
    }

    async listIndexes(collection) {
        await this.ensureConnection();
        
        try {
            console.log(`Database: Listing indexes for ${collection}`);
            const indexes = await this.#dbEngine.listIndexes(collection);
            console.log(`Database: Found indexes:`, indexes);
            return indexes;
        } catch (error) {
            console.error(`Database: ListIndexes operation failed:`, error);
            throw error;
        }
    }

    async disconnect() {
        if (!this.isConnected()) {
            console.log('Database: Already disconnected');
            return;
        }
        
        try {
            console.log('Database: Disconnecting...');
            await this.#dbEngine?.disconnect();
            this.#initialized = false;
            this.#dbEngine = null;
            console.log('Database: Successfully disconnected');
        } catch (error) {
            console.error('Database: Disconnect failed:', error);
            throw error;
        }
    }

    get supportsExplicitIndexes() {
        return this.#dbEngine?.supportsExplicitIndexes || false;
    }
}

// Export singleton instance
export const db = new Database();
