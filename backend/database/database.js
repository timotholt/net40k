import dotenv from 'dotenv';
import { getDbEngine } from './selectDbEngine.js';

dotenv.config();

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
        if (this.#initialized) {
            return this.#dbEngine;
        }

        try {
            const dbType = process.env.DB_TYPE || 'memory';
            console.log(`Connecting to database type: ${dbType}`);
            
            this.#dbEngine = getDbEngine(dbType);
            await this.#dbEngine.connect();
            
            this.#initialized = true;
            return this.#dbEngine;
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async connect() {
        return this.init();
    }

    async disconnect() {
        if (this.#dbEngine) {
            try {
                console.log('Disconnecting from database...');
                if (typeof this.#dbEngine.disconnect === 'function') {
                    await this.#dbEngine.disconnect();
                }
                this.#dbEngine = null;
                this.#initialized = false;
            } catch (error) {
                console.error('Error disconnecting from database:', error);
            }
        }
    }

    getEngine() {
        if (!this.#initialized) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return this.#dbEngine;
    }

    async find(collection, query) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        return this.#dbEngine.find(collection, query);
    }

    async findOne(collection, query) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        return this.#dbEngine.findOne(collection, query);
    }

    async create(collection, data) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        return this.#dbEngine.create(collection, data);
    }

    async update(collection, query, data) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        return this.#dbEngine.update(collection, query, data);
    }

    async delete(collection, query) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        return this.#dbEngine.delete(collection, query);
    }
}

export const db = new Database();
