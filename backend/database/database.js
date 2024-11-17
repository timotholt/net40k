import { getDbEngine } from './selectDbEngine.js';

class Database {
    #dbEngine;
    #initialized;

    constructor() {
        if (Database.instance) {
            return Database.instance;
        }
        this.#dbEngine = null;
        this.#initialized = false;
        Database.instance = this;
    }

    isConnected() {
        return (this.#dbEngine != null && this.#initialized);
    }

    async init() {
        console.log('Database: Initializing database...');
        console.log('Database: Current initialization state:', this.#initialized);
        
        if (this.#initialized) {
            console.log('Database: Already initialized, reusing existing engine');
            return this.#dbEngine;
        }

        try {
            const dbType = process.env.DB_TYPE || 'memory';
            console.log(`Database: Connecting to database type: ${dbType}`);
            
            this.#dbEngine = getDbEngine(dbType);
            console.log('Database: Engine instance created, connecting...');
            await this.#dbEngine.connect();
            
            this.#initialized = true;
            console.log('Database: Initialization complete, initialized =', this.#initialized);
            return this.#dbEngine;
        } catch (error) {
            console.error('Database: Initialization failed:', error);
            throw error;
        }
    }

    async find(collection, query) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Finding documents in collection:', collection);
        console.log('Database: Query:', query);
        const result = await this.#dbEngine.find(collection, query);
        console.log('Database: Find result:', result);
        return result;
    }

    async findOne(collection, query) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Finding one document in collection:', collection);
        console.log('Database: Query:', query);
        const result = await this.#dbEngine.findOne(collection, query);
        console.log('Database: Find one result:', result);
        return result;
    }

    async create(collection, data) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Creating document in collection:', collection);
        console.log('Database: Data:', data);
        const result = await this.#dbEngine.create(collection, data);
        console.log('Database: Create result:', result);
        return result;
    }

    async update(collection, query, data) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Updating documents in collection:', collection);
        console.log('Database: Query:', query);
        console.log('Database: Data:', data);
        const result = await this.#dbEngine.update(collection, query, data);
        console.log('Database: Update result:', result);
        return result;
    }

    async delete(collection, query) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Deleting documents in collection:', collection);
        console.log('Database: Query:', query);
        const result = await this.#dbEngine.delete(collection, query);
        console.log('Database: Delete result:', result);
        return result;
    }

    async deleteCollection(collection) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Deleting collection:', collection);
        const result = await this.#dbEngine.deleteCollection(collection);
        console.log('Database: Delete collection result:', result);
        return result;
    }

    async disconnect() {
        console.log('Database: Disconnecting...');
        console.log('Database: Current initialization state:', this.#initialized);
        
        if (!this.#initialized) {
            console.log('Database: Already disconnected');
            return;
        }
        
        try {
            await this.#dbEngine.disconnect();
            this.#initialized = false;
            console.log('Database: Disconnection complete, initialized =', this.#initialized);
        } catch (error) {
            console.error('Database: Disconnection failed:', error);
            throw error;
        }
    }
}

// Export only the singleton instance
export const db = new Database();
