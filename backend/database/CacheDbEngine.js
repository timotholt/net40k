import { BaseDbEngine } from './BaseDbEngine.js';
import sizeof from 'object-sizeof';
import logger from '../utils/logger.js';

class TimeStats {
  constructor(intervalMinutes = 60) {
    this.intervalMinutes = intervalMinutes;
    this.currentInterval = this._getCurrentInterval();
    this.intervals = new Map();
    this.dailyStats = new Map();
    this.weeklyStats = new Map();
  }

  _getCurrentInterval() {
    const now = new Date();
    return Math.floor(now.getTime() / (this.intervalMinutes * 60 * 1000));
  }

  _getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  _getWeekKey(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return this._getDateKey(startOfWeek);
  }

  record(bytes) {
    const now = new Date();
    const interval = this._getCurrentInterval();
    const dateKey = this._getDateKey(now);
    const weekKey = this._getWeekKey(now);
    const hourKey = now.getHours();

    // Update interval stats
    if (interval !== this.currentInterval) {
      // Clear old intervals (keep last 24 hours)
      const oldestKeepInterval = interval - (24 * 60 / this.intervalMinutes);
      for (const [key] of this.intervals) {
        if (key < oldestKeepInterval) {
          this.intervals.delete(key);
        }
      }
      this.currentInterval = interval;
    }

    const intervalStats = this.intervals.get(interval) || { bytes: 0, count: 0 };
    intervalStats.bytes += bytes;
    intervalStats.count++;
    this.intervals.set(interval, intervalStats);

    // Update daily stats
    const dayStats = this.dailyStats.get(dateKey) || { 
      total: { bytes: 0, count: 0 },
      hourly: new Array(24).fill(null).map(() => ({ bytes: 0, count: 0 }))
    };
    dayStats.total.bytes += bytes;
    dayStats.total.count++;
    dayStats.hourly[hourKey].bytes += bytes;
    dayStats.hourly[hourKey].count++;
    this.dailyStats.set(dateKey, dayStats);

    // Keep only last 30 days of daily stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldestKeepDate = this._getDateKey(thirtyDaysAgo);
    for (const [key] of this.dailyStats) {
      if (key < oldestKeepDate) {
        this.dailyStats.delete(key);
      }
    }

    // Update weekly stats
    const weekStats = this.weeklyStats.get(weekKey) || { bytes: 0, count: 0 };
    weekStats.bytes += bytes;
    weekStats.count++;
    this.weeklyStats.set(weekKey, weekStats);

    // Keep only last 12 weeks of weekly stats
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    const oldestKeepWeek = this._getWeekKey(twelveWeeksAgo);
    for (const [key] of this.weeklyStats) {
      if (key < oldestKeepWeek) {
        this.weeklyStats.delete(key);
      }
    }
  }

  getStats() {
    const now = new Date();
    const currentInterval = this._getCurrentInterval();
    const intervals = Array.from(this.intervals.entries())
      .sort(([a], [b]) => b - a)
      .map(([interval, stats]) => ({
        timestamp: new Date(interval * this.intervalMinutes * 60 * 1000),
        ...stats,
        bytesPerSecond: stats.bytes / (this.intervalMinutes * 60)
      }));

    const dailyStats = Array.from(this.dailyStats.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, stats]) => ({
        date,
        ...stats,
        bytesPerSecond: stats.total.bytes / (24 * 60 * 60),
        bytesPerHour: stats.total.bytes / 24,
        peakHour: stats.hourly.reduce((peak, curr, hour) => 
          curr.bytes > (peak?.bytes || 0) ? { hour, ...curr } : peak, null)
      }));

    const weeklyStats = Array.from(this.weeklyStats.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([week, stats]) => ({
        week,
        ...stats,
        bytesPerDay: stats.bytes / 7,
        bytesPerHour: stats.bytes / (7 * 24)
      }));

    return {
      current: {
        bytesPerSecond: (this.intervals.get(currentInterval)?.bytes || 0) / (this.intervalMinutes * 60),
        bytesPerMinute: (this.intervals.get(currentInterval)?.bytes || 0) / this.intervalMinutes,
        bytesPerHour: (this.intervals.get(currentInterval)?.bytes || 0) * (60 / this.intervalMinutes)
      },
      intervals,
      daily: dailyStats,
      weekly: weeklyStats
    };
  }
}

class CollectionStats {
  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.invalidations = 0;
    this.bytesServedFromCache = 0;
    this.bytesServedFromDb = 0;
    this.bytesInvalidated = 0;
    this.totalReads = 0;
    this.totalWrites = 0;
    this.totalReadBytes = 0;
    this.totalWriteBytes = 0;
    this.timeStats = new TimeStats(15); // 15-minute intervals
  }

  get hitRate() {
    const total = this.hits + this.misses;
    return total ? (this.hits / total * 100).toFixed(2) : 0;
  }

  get averageReadSize() {
    return this.totalReads ? Math.round(this.totalReadBytes / this.totalReads) : 0;
  }

  get averageWriteSize() {
    return this.totalWrites ? Math.round(this.totalWriteBytes / this.totalWrites) : 0;
  }

  recordRead(bytes) {
    this.timeStats.record(bytes);
  }

  recordWrite(bytes) {
    this.timeStats.record(bytes);
  }
}

export class CacheDbEngine extends BaseDbEngine {
  constructor(baseEngine, maxSizeMb = 100) {
    super();
    this.baseEngine = baseEngine;
    this.maxBytes = maxSizeMb * 1024 * 1024;
    this.currentSize = 0;
    this.cache = new Map();
    this.collectionStats = new Map();
    this.supportsExplicitIndexes = baseEngine.supportsExplicitIndexes;
    logger.info('CacheDbEngine: Initialized with base engine:', {
      type: baseEngine.constructor.name,
      maxSizeMb,
      supportsExplicitIndexes: this.supportsExplicitIndexes
    });
  }

  get initialized() {
    return this.baseEngine.initialized;
  }

  async connect() {
    logger.info('CacheDbEngine: Connecting to base engine...');
    const result = await this.baseEngine.connect();
    logger.info('CacheDbEngine: Base engine connection result:', result);
    return result;
  }

  async disconnect() {
    logger.info('CacheDbEngine: Disconnecting...');
    // Clear cache
    this.cache.clear();
    this.collectionStats.clear();
    this.currentSize = 0;
    
    // Disconnect base engine
    if (this.baseEngine && typeof this.baseEngine.disconnect === 'function') {
      await this.baseEngine.disconnect();
    }
    logger.info('CacheDbEngine: Disconnected');
  }

  _getCollectionStats(collection) {
    const collectionName = collection.modelName;
    if (!this.collectionStats.has(collectionName)) {
      this.collectionStats.set(collectionName, new CollectionStats());
    }
    return this.collectionStats.get(collectionName);
  }

  _getCacheKey(collection, query) {
    return `${collection.modelName}:${JSON.stringify(query)}`;
  }

  _getObjectSize(obj) {
    return sizeof(obj);
  }

  _evictIfNeeded(requiredBytes) {
    while (this.currentSize + requiredBytes > this.maxBytes && this.cache.size > 0) {
      const [firstKey] = this.cache.keys();
      const entry = this.cache.get(firstKey);
      this.currentSize -= this._getObjectSize(entry);
      this.cache.delete(firstKey);
    }
  }

  async find(collection, query, options = {}) {
    const stats = this._getCollectionStats(collection);
    stats.totalReads++;

    // For find operations that might need sorting/limiting, bypass cache
    // This ensures consistent behavior with the MongoDB implementation
    stats.misses++;
    const result = await this.baseEngine.find(collection, query, options);
    const resultSize = this._getObjectSize(result);
    stats.bytesServedFromDb += resultSize;
    stats.totalReadBytes += resultSize;
    stats.recordRead(resultSize);

    return result;
  }

  async findOne(collection, query) {
    const stats = this._getCollectionStats(collection);
    const cacheKey = this._getCacheKey(collection, query);
    stats.totalReads++;

    if (this.cache.has(cacheKey)) {
      const cachedResult = this.cache.get(cacheKey);
      const resultSize = this._getObjectSize(cachedResult);
      stats.hits++;
      stats.bytesServedFromCache += resultSize;
      stats.totalReadBytes += resultSize;
      stats.recordRead(resultSize);
      return cachedResult;
    }

    stats.misses++;
    const result = await this.baseEngine.findOne(collection, query);
    const resultSize = this._getObjectSize(result || {});
    stats.bytesServedFromDb += resultSize;
    stats.totalReadBytes += resultSize;
    stats.recordRead(resultSize);

    this._evictIfNeeded(resultSize);
    if (resultSize <= this.maxBytes) {
      this.cache.set(cacheKey, result);
      this.currentSize += resultSize;
    }

    return result;
  }

  async create(collection, data) {
    const stats = this._getCollectionStats(collection);
    stats.totalWrites++;
    const result = await this.baseEngine.create(collection, data);
    const resultSize = this._getObjectSize(data);
    stats.totalWriteBytes += resultSize;
    stats.recordWrite(resultSize);
    this._invalidateCollection(collection);
    return result;
  }

  async update(collection, query, data) {
    const stats = this._getCollectionStats(collection);
    stats.totalWrites++;
    
    // If data has _id, it's a document replacement
    if (data._id) {
      const { _id, ...updateData } = data;
      const result = await this.baseEngine.update(collection, query, { _id, ...updateData });
      const resultSize = this._getObjectSize(data);
      stats.totalWriteBytes += resultSize;
      stats.recordWrite(resultSize);
      
      // Invalidate and refetch into cache
      await this._invalidateCollection(collection);
      const cacheKey = this._getCacheKey(collection, query);
      const updated = await this.baseEngine.findOne(collection, query);
      if (updated) {
        const size = this._getObjectSize(updated);
        this._evictIfNeeded(size);
        this.cache.set(cacheKey, updated);
        this.currentSize += size;
      }
      
      return result;
    }
    
    // For partial updates
    const result = await this.baseEngine.update(collection, query, data);
    const resultSize = this._getObjectSize(data);
    stats.totalWriteBytes += resultSize;
    stats.recordWrite(resultSize);
    
    // Invalidate and refetch into cache
    await this._invalidateCollection(collection);
    const cacheKey = this._getCacheKey(collection, query);
    const updated = await this.baseEngine.findOne(collection, query);
    if (updated) {
      const size = this._getObjectSize(updated);
      this._evictIfNeeded(size);
      this.cache.set(cacheKey, updated);
      this.currentSize += size;
    }
    
    return result;
  }

  async delete(collection, query) {
    const stats = this._getCollectionStats(collection);
    stats.totalWrites++;
    
    // Delete from database first
    const result = await this.baseEngine.delete(collection, query);
    const resultSize = this._getObjectSize(query);
    stats.totalWriteBytes += resultSize;
    stats.recordWrite(resultSize);
    
    // Remove specific cache entry for this query
    const cacheKey = this._getCacheKey(collection, query);
    if (this.cache.has(cacheKey)) {
      const size = this._getObjectSize(this.cache.get(cacheKey));
      this.cache.delete(cacheKey);
      this.currentSize -= size;
    }
    
    // Also invalidate the collection cache since indexes might be affected
    await this._invalidateCollection(collection);
    
    return result;
  }

  async deleteCollection(collection) {
    await this._invalidateCollection(collection);
    return await this.baseEngine.deleteCollection(collection);
  }

  _invalidateCollection(collection) {
    const stats = this._getCollectionStats(collection);
    stats.invalidations++;
    
    // Calculate total size of invalidated entries
    let totalInvalidatedSize = 0;
    
    // Remove all cache entries for this collection
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${collection}:`)) {
        totalInvalidatedSize += this._getObjectSize(value);
        this.cache.delete(key);
      }
    }
    
    // Update stats
    stats.bytesInvalidated += totalInvalidatedSize;
    this.currentSize -= totalInvalidatedSize;
  }

  async createIndex(collection, fields, options = {}) {
    return this.baseEngine.createIndex(collection, fields, options);
  }

  async listIndexes(collection) {
    return this.baseEngine.listIndexes(collection);
  }

  async createCollection(collection) {
    return this.baseEngine.createCollection(collection);
  }

  getCacheStats() {
    const collectionStats = {};
    for (const [collection, stats] of this.collectionStats) {
      const timeStats = stats.timeStats.getStats();
      collectionStats[collection] = {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hitRate,
        invalidations: stats.invalidations,
        bytesServedFromCache: stats.bytesServedFromCache,
        bytesServedFromDb: stats.bytesServedFromDb,
        bytesInvalidated: stats.bytesInvalidated,
        totalBytesServed: stats.bytesServedFromCache + stats.bytesServedFromDb,
        cacheEfficiency: ((stats.bytesServedFromCache / (stats.bytesServedFromCache + stats.bytesServedFromDb)) * 100).toFixed(2),
        totalReads: stats.totalReads,
        totalWrites: stats.totalWrites,
        totalReadBytes: stats.totalReadBytes,
        totalWriteBytes: stats.totalWriteBytes,
        averageReadSize: stats.averageReadSize,
        averageWriteSize: stats.averageWriteSize,
        timeStats
      };
    }

    return {
      overall: {
        entries: this.cache.size,
        currentSize: this.currentSize,
        maxSize: this.maxBytes,
        utilization: (this.currentSize / this.maxBytes) * 100
      },
      collections: collectionStats
    };
  }
}