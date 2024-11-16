import dotenv from 'dotenv';
import { getDbEngine } from './selectDbEngine.js';

dotenv.config();

class Database {
    constructor() {
        if (Database.instance) {
            return Database.instance;
        }
        this.dbEngine = null;
        this.initialized = false;
        Database.instance = this;
    }

    isConnected() {
        return (this.dbEngine != null && this.initialized);
    }

    async init() {
        if (this.initialized) {
            return this.dbEngine;
        }

        try {
            const dbType = process.env.DB_TYPE || 'memory';
            console.log(`Connecting to database type: ${dbType}`);
            
            this.dbEngine = getDbEngine(dbType);
            await this.dbEngine.connect();
            
            this.initialized = true;
            return this.dbEngine;
        } catch (error) {
            console.error('Database connection error:', error);
            // Fall back to in-memory database if connection fails
            console.log('Falling back to in-memory database');
            this.dbEngine = getDbEngine('memory');
            await this.dbEngine.connect();
            this.initialized = true;
            return this.dbEngine;
        }
    }

    async connect() {
        return this.init();
    }

    async disconnect() {
        if (this.dbEngine) {
            try {
                console.log('Disconnecting from database...');
                if (typeof this.dbEngine.disconnect === 'function') {
                    await this.dbEngine.disconnect();
                }
                this.dbEngine = null;
                this.initialized = false;
            } catch (error) {
                console.error('Error disconnecting from database:', error);
            }
        }
    }

    getEngine() {
        if (!this.initialized) {
            throw new Error('Database not initialized. Call init() first.');
        }
        return this.dbEngine;
    }
}

export const db = new Database();
