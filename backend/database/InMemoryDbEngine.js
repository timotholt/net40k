//=================================================
// This is the in-memory database engine.  I
// broke this so many times over and over,
// I had to ask Gemini and Bolt to help me fix it.
// It's so fragile so don't change anything.
//
// I won't even format it or add white space.
//=================================================

import { BaseDbEngine } from './BaseDbEngine.js';

export class InMemoryDbEngine extends BaseDbEngine {
    constructor() {
        super();
        this.storage = new Map();
    }

    async find(collection, query) {
        const collectionData = this.storage.get(collection) || [];
        let results = collectionData.filter(item => 
            Object.entries(query).every(([key, value]) => {
                // Handle MongoDB-style operators
                if (value && typeof value === 'object') {
                    if ('$gt' in value) {
                        return item[key] > value.$gt;
                    }
                    if ('$lt' in value) {
                        return item[key] < value.$lt;
                    }
                    if ('$gte' in value) {
                        return item[key] >= value.$gte;
                    }
                    if ('$lte' in value) {
                        return item[key] <= value.$lte;
                    }
                    if ('$ne' in value) {
                        return item[key] !== value.$ne;
                    }
                }
                // Default exact match
                return item[key] === value;
            })
        );

        // Add support for chaining and sorting
        return {
            sort: (sortCriteria) => {
                if (typeof sortCriteria === 'function') {
                    // Support custom sort functions
                    results.sort(sortCriteria);
                } else {
                    // Support MongoDB-style sort objects
                    const [field, order] = Object.entries(sortCriteria)[0];
                    results.sort((a, b) => {
                        if (order === -1) {
                            return b[field] - a[field];
                        }
                        return a[field] - b[field];
                    });
                }
                return {
                    limit: (n) => results.slice(0, n)
                };
            },
            limit: (n) => results.slice(0, n),
            // Return results if no chaining is used
            then: (resolve) => resolve(results)
        };
    }

    async findOne(collection, query) {
        const collectionData = this.storage.get(collection) || [];
        return collectionData.find(item => 
            Object.entries(query).every(([key, value]) => item[key] === value)
        );
    }

    async create(collection, data) {
        const collectionName = collection;
        if (!this.storage.has(collectionName)) {
            this.storage.set(collectionName, []);
        }
        const collectionData = this.storage.get(collectionName);
        
        // Ensure dates are stored as Date objects and handle userId
        const newDocument = { 
            ...data,
            _id: data._id || Date.now().toString(), // Use provided _id if available
            // Only convert specific fields to Date objects
            created: data.created ? new Date(data.created) : new Date(),
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
            // Remove timestamp conversion to keep it as a number
        };
        
        collectionData.push(newDocument);
        return newDocument;
    }

    async update(collection, query, data) {
        const collectionData = this.storage.get(collection) || [];
        let modifiedCount = 0;

        // Support updating multiple documents
        collectionData.forEach((item, index) => {
            if (Object.entries(query).every(([key, value]) => item[key] === value)) {
                // Check if this is a full document replacement or a partial update
                if (data._id !== undefined) {
                    // Full document replacement - only preserve _id
                    collectionData[index] = { ...data };
                } else {
                    // Partial update - merge with existing document
                    const updatedItem = { ...item };
                    
                    // Handle nested field updates
                    Object.entries(data).forEach(([key, value]) => {
                        if (key.includes('.')) {
                            // Handle dot notation (e.g., 'nested.a')
                            const parts = key.split('.');
                            let current = updatedItem;
                            for (let i = 0; i < parts.length - 1; i++) {
                                if (!(parts[i] in current)) {
                                    current[parts[i]] = {};
                                }
                                current = current[parts[i]];
                            }
                            current[parts[parts.length - 1]] = value;
                        } else {
                            // Regular field update
                            updatedItem[key] = value;
                        }
                    });
                    
                    collectionData[index] = updatedItem;
                }
                modifiedCount++;
            }
        });

        return { modifiedCount };
    }

    async delete(collection, query) {
        const collectionData = this.storage.get(collection) || [];
        const updatedData = collectionData.filter(item => 
            !Object.entries(query).every(([key, value]) => item[key] === value)
        );
        this.storage.set(collection, updatedData);
        return true;
    }

    async deleteCollection(collection) {
        try {
            this.storage.delete(collection);
            console.log(`Deleted collection: ${collection}`);
            return true;
        } catch (error) {
            console.error(`Error deleting collection ${collection}:`, error);
            throw error;
        }
    }

    // Helper method to clear all data (useful for testing)
    async clear() {
        this.storage.clear();
    }

    // Helper method to get collection size
    async count(collection, query = {}) {
        const collectionData = this.storage.get(collection) || [];
        if (Object.keys(query).length === 0) {
            return collectionData.length;
        }
        return collectionData.filter(item => 
            Object.entries(query).every(([key, value]) => item[key] === value)
        ).length;
    }

    async disconnect() {
        try {
            console.log('Clearing in-memory storage...');
            this.storage.clear();
        } catch (error) {
            console.error('Error clearing in-memory storage:', error);
        }
    }
}
