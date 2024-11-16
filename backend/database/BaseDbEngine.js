import DateService from '../services/DateService.js';

// This is the base class for all database engines
//
// Most important is that you HAVE to have a schema for Firebase,
// and that when you initialize your model, we fill in any
// undefined arrays with an empty array, cause Firebase does NOT
// like anything undefined.
//

export class BaseDbEngine {
    _initializeData(model, data) {
        // If no data or no schema, return as is
        if (!data || !model.schema) return data;

        const initialized = { ...data };
        
        // Initialize arrays and other schema-defined fields
        Object.entries(model.schema).forEach(([field, config]) => {
        if (config.type === 'array' && !initialized[field]) {
            initialized[field] = config.default || [];
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
}