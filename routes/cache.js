import express from 'express';
import { db } from '../database/database.js';

const router = express.Router();

// Helper function for formatting bytes
const formatBytes = (bytes) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
};

// Helper function for formatting rates
const formatRate = (bytesPerSecond) => {
    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s', 'PB/s'];
    let value = bytesPerSecond;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
};

// GET /api/cache/transactions
router.get('/transactions', (req, res) => {

    const engine = db.getEngine();
    if (!engine.getCacheStats) {
        return res.json({
            success: false,
            message: 'Caching is not enabled'
        });
    }

    const stats = engine.getCacheStats();
    const transactionStats = {
        overall: {
            entries: stats.overall.entries,
            utilization: `${stats.overall.utilization.toFixed(2)}%`
        },
        collections: {}
    };

    for (const [collection, collStats] of Object.entries(stats.collections)) {
        transactionStats.collections[collection] = {
            hits: collStats.hits,
            misses: collStats.misses,
            hitRate: `${collStats.hitRate}%`,
            invalidations: collStats.invalidations,
            totalReads: collStats.totalReads,
            totalWrites: collStats.totalWrites,
            cacheEfficiency: `${collStats.cacheEfficiency}%`,
            timeStats: {
                current: {
                    readsPerSecond: (collStats.timeStats.current.bytesPerSecond / collStats.averageReadSize).toFixed(2),
                    writesPerSecond: (collStats.timeStats.current.bytesPerSecond / collStats.averageWriteSize).toFixed(2)
                },
                daily: collStats.timeStats.daily.map(day => ({
                    date: day.date,
                    operations: day.count,
                    operationsPerHour: (day.count / 24).toFixed(2)
                })),
                weekly: collStats.timeStats.weekly.map(week => ({
                    week: week.week,
                    operations: week.count,
                    operationsPerDay: (week.count / 7).toFixed(2)
                }))
            }
        };
    }

    res.json({
        success: true,
        stats: transactionStats
    });
});

// GET /api/cache/volume
router.get('/volume', (req, res) => {
    const engine = db.getEngine();
    if (!engine.getCacheStats) {
        return res.json({
        success: false,
        message: 'Caching is not enabled'
        });
    }

    const stats = engine.getCacheStats();
    const volumeStats = {
        overall: {
        currentSize: formatBytes(stats.overall.currentSize),
        maxSize: formatBytes(stats.overall.maxSize)
        },
        collections: {}
    };

    for (const [collection, collStats] of Object.entries(stats.collections)) {
        volumeStats.collections[collection] = {
            bytesServedFromCache: formatBytes(collStats.bytesServedFromCache),
            bytesServedFromDb: formatBytes(collStats.bytesServedFromDb),
            totalBytesServed: formatBytes(collStats.totalBytesServed),
            totalReadBytes: formatBytes(collStats.totalReadBytes),
            totalWriteBytes: formatBytes(collStats.totalWriteBytes),
            averageReadSize: formatBytes(collStats.averageReadSize),
            averageWriteSize: formatBytes(collStats.averageWriteSize),
            timeStats: {
                current: {
                    bytesPerSecond: formatRate(collStats.timeStats.current.bytesPerSecond),
                    bytesPerMinute: formatBytes(collStats.timeStats.current.bytesPerMinute),
                    bytesPerHour: formatBytes(collStats.timeStats.current.bytesPerHour),
                    bytesPerDay: formatBytes(collStats.timeStats.current.bytesPerSecond * 86400),
                    bytesPerMonth: formatBytes(collStats.timeStats.current.bytesPerSecond * 86400 * 30)
                },
                intervals: collStats.timeStats.intervals.map(interval => ({
                    timestamp: interval.timestamp.toISOString(),
                    bytes: formatBytes(interval.bytes),
                    bytesPerSecond: formatRate(interval.bytesPerSecond)
                })),
                daily: collStats.timeStats.daily.map(day => ({
                    date: day.date,
                    bytes: formatBytes(day.bytes),
                    bytesPerHour: formatBytes(day.bytesPerHour),
                    bytesPerDay: formatBytes(day.bytes)
                })),
                weekly: collStats.timeStats.weekly.map(week => ({
                    week: week.week,
                    bytes: formatBytes(week.bytes),
                    bytesPerDay: formatBytes(week.bytesPerDay)
                }))
            }
        };
    }

    res.json({
        success: true,
        stats: volumeStats
    });
});

export default router;