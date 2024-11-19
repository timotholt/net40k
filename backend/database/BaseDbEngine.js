import DateService from '../services/DateService.js';

// This is the base class for all database engines
//
// Most important is that you HAVE to have a schema for Firebase,
// and that when you initialize your model, we fill in any
// undefined arrays with an empty array, cause Firebase does NOT
// like anything undefined.
//

export class BaseDbEngine {
    _initializeData(collection, data) {
        // If no data, return as is
        if (!data) return data;

        const initialized = { ...data };
        
        // Initialize any undefined arrays to empty arrays for Firebase compatibility
        Object.entries(initialized).forEach(([field, value]) => {
            if (Array.isArray(value)) {
                initialized[field] = value || [];
            }
        });
        
        return initialized;
    }

    // Normalize dates across different database types
    _normalizeDates(data) {
        if (!data || typeof data !== 'object') return data;

        const normalized = Array.isArray(data) ? [] : {};

        for (const [key, value] of Object.entries(data)) {
            if (value instanceof Date) {
                // Convert Date to our standard format
                normalized[key] = {
                    date: value,
                    timestamp: value.getTime()
                };
            } else if (value && typeof value === 'object') {
                // Recursively normalize nested objects
                normalized[key] = this._normalizeDates(value);
            } else {
                normalized[key] = value;
            }
        }

        return normalized;
    }

    async connect() {
        // Base implementation - override in specific engines
        return Promise.resolve();
    }

    async find(collection, query) {
        throw new Error('Method not implemented');
    }

    async findOne(collection, query) {
        throw new Error('Method not implemented');
    }

    async create(collection, data) {
        throw new Error('Method not implemented');
    }

    async update(collection, query, data) {
        throw new Error('Method not implemented');
    }

    async delete(collection, query) {
        throw new Error('Method not implemented');
    }

    // Delete all documents in a collection
    async deleteCollection(collection) {
        throw new Error('Method not implemented');
    }

    // Create a new collection
    async createCollection(collection) {
        throw new Error('Method not implemented');
    }

    // Create an index on a collection
    async createIndex(collection, fields, options = {}) {
        throw new Error('Method not implemented');
    }

    // List all indexes on a collection
    async listIndexes(collection) {
        throw new Error('Method not implemented');
    }
}