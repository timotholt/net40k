import { MongoDbEngine } from './MongoDbEngine.js';
import { InMemoryDbEngine } from './InMemoryDbEngine.js';
import { FirestoreDbEngine } from './FirestoreDbEngine.js';
import { CacheDbEngine } from './CacheDbEngine.js';

export function getDbEngine(type) {
  // First get the base database engine
  let baseEngine;
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
    const cacheSizeMb = parseInt(process.env.CACHE_SIZE_MB || '100', 10);
    return new CacheDbEngine(baseEngine, cacheSizeMb);
  }

  return baseEngine;
}