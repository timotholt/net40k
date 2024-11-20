// DO NOT CHANGE THIS FILE  JUST DO NOT
// Tim -- 11/17/2024

/*
 * TODO: Field Deletion Support
 * -----------------------------
 * Currently, the engine only supports setting fields to null but not truly deleting them.
 * Firestore natively supports field deletion via FieldValue.delete(), which removes fields
 * entirely from documents. While our service layer doesn't currently transform documents
 * by deleting fields, we may want to add this capability in the future for more granular
 * document management. This would require:
 * 1. Importing FieldValue from firebase/firestore
 * 2. Adding field deletion detection in update operations
 * 3. Converting null fields to FieldValue.delete() when appropriate
 * 4. Updating tests to verify field deletion behavior
 */

import { BaseDbEngine } from './BaseDbEngine.js';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection as firestoreCollection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    writeBatch,
    setLogLevel,
    Timestamp
} from 'firebase/firestore';
import dotenv from 'dotenv';
import { flatten, unflatten } from 'flat';
import { UuidService } from '../services/UuidService.js';
import logger from '../utils/logger.js';

dotenv.config();

// Utility function to handle transient Firestore errors with exponential backoff
const withRetry = async (operation, maxAttempts = 3) => {
    const transientErrors = ['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'DEADLINE_EXCEEDED', 'ABORTED'];
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            if (!transientErrors.includes(error.code) || attempt === maxAttempts) throw error;
            const delay = Math.min(100 * Math.pow(2, attempt), 1000);
            logger.warn(`Retrying operation after transient error: ${error.code}. Attempt ${attempt} of ${maxAttempts}. Waiting ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

const validateDotEnv = () => {
    const requiredFields = [
        'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID'
    ];

    const missingFields = [];
    for (const field of requiredFields) {
        if (!process.env[field] || process.env[field].trim() === '') {
            logger.error(`Missing or empty Firebase config: ${field}`);
            missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        logger.error('Missing Firebase configuration fields:', missingFields);
        throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
    }
};

export class FirestoreDbEngine extends BaseDbEngine {
    constructor() {
        super();
        this.app = null;
        this.db = null;
        this.initialized = false;
        this.initializationPromise = null;

        try {
            validateDotEnv();
        } catch (error) {
            logger.error('Firebase env validation error:', error);
            throw error;
        }
    }

    async connect() {
        const state = {
            initialized: this.initialized,
            hasApp: !!this.app,
            hasDb: !!this.db,
            hasInitPromise: !!this.initializationPromise
        };

        if (this.initialized && this.app && this.db) {
            return true;
        }

        if (this.initializationPromise) {
            await this.initializationPromise;
            return true;
        }

        try {
            this.initializationPromise = this._initialize();
            await this.initializationPromise;

            return true;
        } catch (error) {
            logger.error('FirestoreDbEngine: Initialization failed:', error);
            this.initialized = false;
            this.initializationPromise = null;
            throw error;
        }
    }

    async _initialize() {
        try {
            if (!this.app) {
                logger.info('Creating new Firebase app instance...');
                this.app = initializeApp({
                    apiKey: process.env.FIREBASE_API_KEY,
                    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                    appId: process.env.FIREBASE_APP_ID
                });
                logger.info('Firebase app created successfully');
            }

            if (!this.db) {
                logger.info('Creating new Firestore instance...');
                // Set log level to error to suppress warnings
                setLogLevel('error');
                this.db = getFirestore(this.app);
                logger.info('Firestore instance created successfully');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            logger.error('FirestoreDbEngine: Error during initialization:', error);
            this.initialized = false;
            throw error;
        }
    }

    _normalizeDates(data) {
        const normalized = { ...data };
        Object.keys(normalized).forEach(key => {
            const value = normalized[key];
            if (value === undefined) {
                normalized[key] = null;
            } else if (value instanceof Date) {
                // Keep dates as is, they'll be converted to Timestamps later
                normalized[key] = value;
            } else if (Array.isArray(value)) {
                // Preserve arrays and normalize their contents
                normalized[key] = value.map(item => {
                    if (item === undefined) return null;
                    if (typeof item === 'object' && item !== null) {
                        return this._normalizeDates(item);
                    }
                    return item;
                });
            } else if (typeof value === 'object' && value !== null) {
                // Recursively normalize nested objects
                normalized[key] = this._normalizeDates(value);
            }
        });
        return normalized;
    }

    _convertToFirestoreData(data) {
        if (!data) return data;

        const converted = { ...data };
        for (const [key, value] of Object.entries(converted)) {
            if (value instanceof Date) {
                converted[key] = Timestamp.fromDate(value);
                logger.info('Converting Date to Timestamp:', key, value);
            } else if (Array.isArray(value)) {
                // Handle nested arrays by flattening them with a special format
                converted[key] = this._convertArrayToFirestore(value);
            } else if (value && typeof value === 'object') {
                converted[key] = this._convertToFirestoreData(value);
            }
        }
        return converted;
    }

    _convertArrayToFirestore(arr) {
        return arr.map(item => {
            if (Array.isArray(item)) {
                // Convert nested array to object with special format
                return {
                    _type: 'array',
                    value: this._convertArrayToFirestore(item)
                };
            } else if (item instanceof Date) {
                return Timestamp.fromDate(item);
            } else if (item && typeof item === 'object') {
                return this._convertToFirestoreData(item);
            }
            return item;
        });
    }

    _convertFromFirestoreData(data) {
        if (!data) return data;

        const converted = { ...data };
        for (const [key, value] of Object.entries(converted)) {
            if (value && typeof value === 'object') {
                // Check for Firestore Timestamp
                if (value.toDate && typeof value.toDate === 'function' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                    // Use Firestore's toDate() to ensure consistent conversion
                    converted[key] = value.toDate();
                    logger.info('Converted Timestamp:', {
                        key,
                        original: value,
                        result: converted[key],
                        isDate: converted[key] instanceof Date,
                        dateTime: converted[key].toISOString()
                    });
                } else if (Array.isArray(value)) {
                    converted[key] = this._convertArrayFromFirestore(value);
                } else {
                    converted[key] = this._convertFromFirestoreData(value);
                }
            }
        }
        return converted;
    }

    _convertArrayFromFirestore(arr) {
        return arr.map(item => {
            if (item && typeof item === 'object') {
                // Check for Firestore Timestamp
                if (item.toDate && typeof item.toDate === 'function' && item.seconds !== undefined && item.nanoseconds !== undefined) {
                    // Use Firestore's toDate() to ensure consistent conversion
                    return item.toDate();
                } else if (item._type === 'array') {
                    return this._convertArrayFromFirestore(item.value);
                } else {
                    return this._convertFromFirestoreData(item);
                }
            }
            return item;
        });
    }

    _flattenObject(obj) {
        if (obj === undefined || obj === null) return obj;
        
        // Handle arrays (including nested)
        if (Array.isArray(obj)) {
            logger.info('Flattening array:', JSON.stringify(obj));
            const result = obj.map(item => this._flattenObject(item));
            logger.info('Flattened array result:', JSON.stringify(result));
            return result;
        }

        // Handle primitive values and Dates
        if (typeof obj !== 'object' || obj instanceof Date || obj instanceof Timestamp) {
            return obj;
        }

        // Handle objects
        const processed = {};
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                logger.info(`Processing array at key ${key}:`, JSON.stringify(value));
                // Preserve arrays as is, just process their contents
                processed[key] = value.map(item => this._flattenObject(item));
                logger.info(`Processed array at key ${key}:`, JSON.stringify(processed[key]));
            } else if (typeof value === 'object' && value !== null && !(value instanceof Date) && !(value instanceof Timestamp)) {
                // Only flatten non-array objects
                const flattened = flatten(value, {
                    safe: true,
                    delimiter: '.'
                });
                processed[key] = this._flattenObject(flattened);
            } else {
                processed[key] = value;
            }
        }
        return processed;
    }

    _unflattenObject(obj) {
        if (!obj) return obj;

        // If it's already a Timestamp, return it
        if (obj instanceof Timestamp) {
            return obj;
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this._unflattenObject(item));
        }

        // If it's not an object, return as is
        if (typeof obj !== 'object') {
            return obj;
        }

        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (!value) {
                result[key] = value;
                continue;
            }

            // If it looks like a Timestamp
            if (typeof value === 'object' && 
                'seconds' in value && 
                'nanoseconds' in value &&
                typeof value.seconds === 'number' &&
                typeof value.nanoseconds === 'number') {
                result[key] = new Timestamp(value.seconds, value.nanoseconds);
                continue;
            }

            // Handle arrays
            if (Array.isArray(value)) {
                result[key] = value.map(item => this._unflattenObject(item));
                continue;
            }

            // Handle nested objects
            if (typeof value === 'object') {
                result[key] = this._unflattenObject(value);
                continue;
            }

            // Handle primitive values
            result[key] = value;
        }

        return result;
    }

    _getCollectionName(collection) {
        if (typeof collection === 'string') {
            return collection.toLowerCase();
        }
        throw new Error('Invalid collection: must be a string');
    }
        
    _buildQuery(collectionRef, queryObj) {
        let q = query(collectionRef);
        
        Object.entries(queryObj).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof Date) {
                    q = query(q, where(key, '==', Timestamp.fromDate(value)));
                } else if (typeof value === 'object' && !(value instanceof Timestamp)) {
                    Object.entries(value).forEach(([operator, operandValue]) => {
                        if (operandValue !== undefined) {
                            const convertedValue = operandValue instanceof Date ? 
                                Timestamp.fromDate(operandValue) : 
                                operandValue;

                            switch(operator) {
                                case '$ne':
                                    q = query(q, where(key, '!=', convertedValue));
                                    break;
                                case '$gt':
                                    q = query(q, where(key, '>', convertedValue));
                                    break;
                                case '$gte':
                                    q = query(q, where(key, '>=', convertedValue));
                                    break;
                                case '$lt':
                                    q = query(q, where(key, '<', convertedValue));
                                    break;
                                case '$lte':
                                    q = query(q, where(key, '<=', convertedValue));
                                    break;
                            }
                        }
                    });
                } else {
                    q = query(q, where(key, '==', value));
                }
            }
        });
        
        return q;
    }

    async find(collection, queryObj, options = {}) {
        if (!this.initialized || !this.db) {
            logger.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            
            // Normalize and flatten the query object
            const normalizedQuery = this._normalizeDates(queryObj || {});
            const flattenedQuery = this._flattenObject(normalizedQuery);
            
            let q = this._buildQuery(collectionRef, flattenedQuery);
            
            // Use withRetry to handle transient errors including BloomFilter
            const snapshot = await withRetry(async () => {
                try {
                    return await getDocs(q);
                } catch (error) {
                    if (error.message?.includes('BloomFilter')) {
                        logger.info(`Retrying after BloomFilter error for collection ${collectionName}`);
                        // Force a small delay before retry
                        await new Promise(resolve => setTimeout(resolve, 100));
                        return await getDocs(q);
                    }
                    throw error;
                }
            });
            
            // Process results
            const results = snapshot.docs.map(doc => {
                const data = doc.data();
                logger.info('\nDocument Processing Steps:');
                logger.info('1. Raw doc data:', {
                    data,
                    id: doc.id,
                    created: data.created,
                    createdType: data.created?.constructor?.name
                });

                const unflattened = this._unflattenObject(data);
                logger.info('2. Unflattened data:', {
                    unflattened,
                    created: unflattened.created,
                    createdType: unflattened.created?.constructor?.name
                });

                const withDates = this._convertFromFirestoreData(unflattened);
                logger.info('3. Data with dates:', {
                    withDates,
                    created: withDates.created,
                    createdType: withDates.created?.constructor?.name,
                    isDate: withDates.created instanceof Date
                });

                // Remove _id from returned data
                const { _id, ...cleanData } = withDates;
                return cleanData;
            });

            return {
                sort: (sortCriteria) => {
                    if (typeof sortCriteria === 'function') {
                        results.sort(sortCriteria);
                    } else {
                        const [field, order] = Object.entries(sortCriteria)[0];
                        q = query(q, orderBy(field, order === -1 ? 'desc' : 'asc'));
                    }
                    return {
                        limit: (n) => results.slice(0, n),
                        then: (resolve) => resolve(results)
                    };
                },
                limit: (n) => results.slice(0, n),
                then: (resolve) => resolve(results)
            };
        } catch (error) {
            logger.error('Error in find:', error);
            throw error;
        }
    }

    async findOne(collection, queryObj) {
        if (!this.initialized || !this.db) {
            logger.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            // Use query to find first matching document
            const results = await this.find(collection, queryObj, 1);
            logger.info('FindOne results:', results);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            logger.error('Error in findOne:', error);
            throw error;
        }
    }

    async update(collection, queryObj, data) {
        logger.info('FirestoreDbEngine: Updating document in collection:', collection);
        logger.info('');
        logger.info('FirestoreDbEngine: Query:', queryObj);
        logger.info('');
        logger.info('FirestoreDbEngine: Data:', data);
        logger.info('');
        
        if (!this.initialized || !this.db) {
            logger.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            const normalizedQuery = this._normalizeDates(queryObj || {});
            const flattenedQuery = this._flattenObject(normalizedQuery);
            const q = this._buildQuery(collectionRef, flattenedQuery);

            // Get matching documents
            const snapshot = await getDocs(q);
            let modifiedCount = 0;

            // Convert update data
            const updateData = this._convertToFirestoreData(data);

            // Update each document
            for (const docSnap of snapshot.docs) {
                await withRetry(() => updateDoc(docSnap.ref, updateData));
                modifiedCount++;
            }

            return { modifiedCount };
        } catch (error) {
            logger.error('Error in update:', error);
            throw error;
        }
    }

    async create(collection, data) {
        logger.info('FirestoreDbEngine: Creating document in collection:', collection);
        logger.info('');
        logger.info('FirestoreDbEngine: Current initialization state:', this.initialized);
        logger.info('');
        
        if (!this.initialized || !this.db) {
            logger.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            // Make a copy of the data to avoid modifying the input
            const docToInsert = { ...data };

            // Convert data to Firestore-compatible format
            const firestoreData = this._convertToFirestoreData(docToInsert);
            
            // Get collection reference
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            
            // Create a new document using UUID as the document ID
            const docRef = doc(collectionRef, docToInsert.uuid);
            
            // Set the document data with retry
            await withRetry(() => setDoc(docRef, firestoreData));
            
            // Get fresh data after creation with retry
            const docSnap = await withRetry(() => getDoc(docRef));
            
            // Return the created document data with dates converted back
            const result = this._convertFromFirestoreData(docSnap.data());
            logger.info('Final data from create:', result);
            return result;
        } catch (error) {
            logger.error('Error creating document:', error);
            throw error;
        }
    }

    async delete(collection, queryObj) {
        logger.info('FirestoreDbEngine: Deleting documents in collection:', collection);
        logger.info('');
        logger.info('FirestoreDbEngine: Query:', queryObj);
        logger.info('');
        
        if (!this.initialized || !this.db) {
            logger.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            // Get collection reference and build query
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            const normalizedQuery = this._normalizeDates(queryObj || {});
            const flattenedQuery = this._flattenObject(normalizedQuery);
            const q = this._buildQuery(collectionRef, flattenedQuery);

            // Get matching documents
            const snapshot = await getDocs(q);
            let deletedCount = 0;

            // Delete each document
            for (const docSnap of snapshot.docs) {
                await withRetry(() => deleteDoc(docSnap.ref));
                deletedCount++;
            }

            logger.info(`Deleted ${deletedCount} documents`);
            return { deletedCount };
        } catch (error) {
            logger.error('Error in delete:', error);
            throw error;
        }
    }

    async deleteCollection(collection) {
        logger.info('FirestoreDbEngine: DeleteCollection called, state:', {
            initialized: this.initialized,
            hasApp: !!this.app,
            hasDb: !!this.db
        });
        logger.info('');
        
        if (!this.initialized || !this.db) {
            logger.error('FirestoreDbEngine: Cannot delete collection - not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            const collectionName = this._getCollectionName(collection);
            logger.info(`FirestoreDbEngine: Attempting to delete collection: ${collectionName}`);
            logger.info('');
            
            const collectionRef = firestoreCollection(this.db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                logger.info(`FirestoreDbEngine: Collection ${collectionName} is already empty`);
                logger.info('');
                return true;
            }

            const batchSize = 500;
            const docs = snapshot.docs;
            let count = 0;

            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = writeBatch(this.db);
                const chunk = docs.slice(i, i + batchSize);
                
                chunk.forEach(doc => {
                    batch.delete(doc.ref);
                    count++;
                });

                await withRetry(() => batch.commit());
                logger.info(`FirestoreDbEngine: Deleted batch of ${chunk.length} documents from ${collectionName}`);
                logger.info('');
            }

            logger.info(`FirestoreDbEngine: Successfully deleted collection ${collectionName} (${count} documents)`);
            logger.info('');
            return true;
        } catch (error) {
            logger.error(`FirestoreDbEngine: Error deleting collection ${collection}:`, error);
            throw error;
        }
    }

    async disconnect() {
        logger.info('FirestoreDbEngine: Disconnect called, current state:', {
            initialized: this.initialized,
            hasApp: !!this.app,
            hasDb: !!this.db,
            hasInitPromise: !!this.initializationPromise
        });
        logger.info('');
        
        try {
            // Clear database reference
            this.db = null;

            if (this.app) {
                logger.info('FirestoreDbEngine: Attempting to delete Firebase app...');
                logger.info('');
                try {
                    // Use deleteApp from firebase/app instead of app.delete()
                    const { deleteApp } = await import('firebase/app');
                    await deleteApp(this.app);
                    logger.info('FirestoreDbEngine: Firebase app deleted successfully');
                    logger.info('');
                } catch (error) {
                    logger.info('FirestoreDbEngine: Error deleting Firebase app:', error.message);
                    logger.info('');
                    // Continue cleanup even if app deletion fails
                }
                this.app = null;
            }

            // Reset initialization state
            this.initialized = false;
            this.initializationPromise = null;

            logger.info('FirestoreDbEngine: Cleanup complete, final state:', {
                initialized: this.initialized,
                hasApp: !!this.app,
                hasDb: !!this.db,
                hasInitPromise: !!this.initializationPromise
            });
            logger.info('');
        } catch (error) {
            logger.error('FirestoreDbEngine: Error during disconnect:', error);
            throw error;
        }
    }

    async createCollection(collection) {
        if (typeof collection !== 'string') {
            throw new Error('Invalid collection: must be a string');
        }
        // Firestore creates collections implicitly when documents are added
        // No explicit creation needed
        return true;
    }

    async createIndex(collection, fields, options = {}) {
        // Firestore manages indexes through the Firebase Console or firebase.json
        // No runtime index creation supported
        return true;
    }

    async listIndexes(collection) {
        // Firestore manages indexes through the Firebase Console or firebase.json
        // No runtime index listing supported
        return [];
    }
}