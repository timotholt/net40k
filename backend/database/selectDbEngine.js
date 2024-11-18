import { MongoDbEngine } from './MongoDbEngine.js';
import { InMemoryDbEngine } from './InMemoryDbEngine.js';
import { FirestoreDbEngine } from './FirestoreDbEngine.js';
import { CacheDbEngine } from './CacheDbEngine.js';

let baseEngine = null;

export function getDbEngine(type) {
    console.log('SelectDbEngine: Getting database engine for type:', type);
    
    if (baseEngine !== null) {
        console.log('SelectDbEngine: Returning existing engine instance');
        return baseEngine;
    }

    // First get the base database engine
    console.log('SelectDbEngine: Creating new base engine instance');
    switch (type) {
        case 'mongodb':
            baseEngine = new MongoDbEngine();
            break;
        case 'memory':
            baseEngine = new InMemoryDbEngine();
            break;
        case 'firestore':
            baseEngine = new FirestoreDbEngine();
            break;
        default:
            throw new Error(`Unknown database type: ${type}`);
    }

    // Wrap with cache if enabled
    const enableCache = process.env.ENABLE_CACHE === 'true';
    if (enableCache) {
        console.log('SelectDbEngine: Cache enabled, wrapping base engine');
        const cacheSizeMb = parseInt(process.env.CACHE_SIZE_MB || '100', 10);
        baseEngine = new CacheDbEngine(baseEngine, cacheSizeMb);
    } else {
        console.log('SelectDbEngine: Cache disabled, using base engine directly');
    }

    return baseEngine;
}