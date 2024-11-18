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
        console.log('Database: Init called, current state:', {
            initialized: this.#initialized,
            hasEngine: !!this.#dbEngine
        });
        
        if (this.#initialized && this.#dbEngine && this.#dbEngine.initialized) {
            console.log('Database: Already initialized, reusing existing engine');
            return this.#dbEngine;
        }

        try {
            const dbType = process.env.DB_TYPE || 'memory';
            console.log(`Database: Using database type: ${dbType}`);
            
            if (!this.#dbEngine) {
                console.log('Database: Creating new database engine instance');
                this.#dbEngine = getDbEngine(dbType);
            } else {
                console.log('Database: Reusing existing database engine instance');
            }
            
            console.log('Database: Connecting to engine...');
            const connected = await this.#dbEngine.connect();
            
            if (!connected || !this.#dbEngine.initialized) {
                throw new Error('Database engine failed to initialize');
            }
            
            // Sync initialization state with engine
            this.#initialized = this.#dbEngine.initialized;
            console.log('Database: Connection complete, state:', {
                initialized: this.#initialized,
                hasEngine: !!this.#dbEngine,
                engineInitialized: this.#dbEngine.initialized
            });
            
            return this.#dbEngine;
        } catch (error) {
            console.error('Database: Initialization failed:', error);
            this.#initialized = false;
            console.log('Database: Failed state:', {
                initialized: this.#initialized,
                hasEngine: !!this.#dbEngine,
                engineInitialized: this.#dbEngine?.initialized
            });
            throw error;
        }
    }

    async find(collection, query, options = {}) {
        if (!this.#initialized) {
            throw new Error('Database not initialized');
        }
        console.log('Database: Finding documents in collection:', collection);
        console.log('Database: Query:', query);
        let result = await this.#dbEngine.find(collection, query);
        
        // Handle the chainable methods from MongoDB engine
        if (options.sort && result && typeof result.sort === 'function') {
            // Convert MongoDB-style sort object to comparison function
            if (typeof options.sort === 'object') {
                const [field, order] = Object.entries(options.sort)[0];
                result = result.sort((a, b) => {
                    if (order === -1) {
                        return b[field] - a[field];
                    }
                    return a[field] - b[field];
                });
            } else {
                // If it's already a function, use it directly
                result = result.sort(options.sort);
            }
            
            // Apply limit if needed
            if (options.limit && result && typeof result.limit === 'function') {
                result = result.limit(options.limit);
            }
            
            // Resolve the final result if it's a promise
            if (result && typeof result.then === 'function') {
                result = await result;
            }
        } else if (options.limit && result && typeof result.limit === 'function') {
            result = result.limit(options.limit);
            
            // Resolve the final result if it's a promise
            if (result && typeof result.then === 'function') {
                result = await result;
            }
        } else if (result && typeof result.then === 'function') {
            result = await result;
        }
        
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
        console.log('Database: DeleteCollection called, current state:', {
            initialized: this.#initialized,
            hasEngine: !!this.#dbEngine
        });
        
        if (!this.#initialized || !this.#dbEngine) {
            console.error('Database: Cannot delete collection - not initialized');
            throw new Error('Database not initialized');
        }
        
        console.log(`Database: Deleting collection: ${collection}`);
        return await this.#dbEngine.deleteCollection(collection);
    }

    async disconnect() {
        console.log('Database: Disconnect called, current state:', {
            initialized: this.#initialized,
            hasEngine: !!this.#dbEngine
        });
        
        if (!this.#initialized) {
            console.log('Database: Already disconnected');
            return;
        }
        
        if (!this.#dbEngine) {
            console.log('Database: No engine instance to disconnect');
            this.#initialized = false;
            return;
        }
        
        try {
            console.log('Database: Disconnecting engine...');
            await this.#dbEngine.disconnect();
            
            // Sync initialization state with engine
            this.#initialized = this.#dbEngine.initialized;
            console.log('Database: Disconnection complete, state:', {
                initialized: this.#initialized,
                hasEngine: !!this.#dbEngine,
                engineInitialized: this.#dbEngine.initialized
            });
        } catch (error) {
            console.error('Database: Disconnection failed:', error);
            throw error;
        }
    }
}

// Export only the singleton instance
export const db = new Database();
