import dotenv from 'dotenv';
import { getDbEngine } from './selectDbEngine.js';

dotenv.config();

class Database {
    constructor() {
        if (Database.instance) {
        return Database.instance;
        }
        this.dbEngine = null;
        Database.instance = this;
    }

    isConnected() {
        return (this.dbEngine != null);
    }

    async connect() {
        if (this.dbEngine) {
        return this.dbEngine;
        }

        try {
        const dbType = process.env.DB_TYPE || 'memory';
        console.log(`Connecting to database type: ${dbType}`);
        
        this.dbEngine = getDbEngine(dbType);

        console.log(this.dbEngine);
        await this.dbEngine.connect();
        
        return this.dbEngine;
        } catch (error) {
        console.error('Database connection error:', error);
        // Fall back to in-memory database if connection fails
        console.log('Falling back to in-memory database');
        this.dbEngine = getDbEngine('memory');
        await this.dbEngine.connect();
        return this.dbEngine;
        }
    }

    getEngine() {
        return this.dbEngine;
    }
}

export const db = new Database();

