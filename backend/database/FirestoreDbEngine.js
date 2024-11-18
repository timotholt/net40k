// DO NOT CHANGE THIS FILE  JUST DO NOT
// Tim -- 11/17/2024

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
            console.log(`Retrying operation after transient error: ${error.code}. Attempt ${attempt} of ${maxAttempts}. Waiting ${delay}ms`);
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
        console.error(`Missing or empty Firebase config: ${field}`);
        missingFields.push(field);
        }
    }

    if (missingFields.length > 0) {
        console.error('Missing Firebase configuration fields:', missingFields);
        throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
    }
};

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

export class FirestoreDbEngine extends BaseDbEngine {
    constructor() {
        super();
        this.app = null;
        this.db = null;
        this.initialized = false;
        this.initializationPromise = null;

        // console.log('FirestoreDbEngine: Constructor called, initialized =', this.initialized);

        try {
            validateDotEnv();
//            console.log('FirestoreDbEngine: Environment validation successful');
        } catch (error) {
            console.error('Firebase env validation error:', error);
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

//        console.log('FirestoreDbEngine: Connect called, current state:', state);

        if (this.initialized && this.app && this.db) {
//            console.log('FirestoreDbEngine: Already initialized, reusing existing connection');
            return true;
        }

        if (this.initializationPromise) {
//            console.log('FirestoreDbEngine: Initialization in progress, waiting...');
            await this.initializationPromise;
            return true;
        }

        try {
            this.initializationPromise = this._initialize();
            await this.initializationPromise;

            const finalState = {
                initialized: this.initialized,
                hasApp: !!this.app,
                hasDb: !!this.db
            };
//            console.log('FirestoreDbEngine: Initialization complete, final state:', finalState);
            return true;
        } catch (error) {
            console.error('FirestoreDbEngine: Initialization failed:', error);
            this.initialized = false;
            this.initializationPromise = null;
            throw error;
        }
    }

    async _initialize() {
        try {
            if (!this.app) {
//                console.log('FirestoreDbEngine: Creating new Firebase app instance...');
                this.app = initializeApp(firebaseConfig);
//                console.log('FirestoreDbEngine: Firebase app created successfully');
            }

            if (!this.db) {
//                console.log('FirestoreDbEngine: Creating new Firestore instance...');
                this.db = getFirestore(this.app);
//                console.log('FirestoreDbEngine: Firestore instance created successfully');
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('FirestoreDbEngine: Error during initialization:', error);
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
            if (value instanceof Timestamp) {
                converted[key] = value.toDate();
            } else if (Array.isArray(value)) {
                converted[key] = this._convertArrayFromFirestore(value);
            } else if (value && typeof value === 'object') {
                converted[key] = this._convertFromFirestoreData(value);
            }
        }
        return converted;
    }

    _convertArrayFromFirestore(arr) {
        return arr.map(item => {
            if (item && typeof item === 'object') {
                if (item._type === 'array') {
                    // Convert back from our special format to a real array
                    return this._convertArrayFromFirestore(item.value);
                } else if (item instanceof Timestamp) {
                    return item.toDate();
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
//            console.log('Flattening array:', JSON.stringify(obj));
            const result = obj.map(item => this._flattenObject(item));
//            console.log('Flattened array result:', JSON.stringify(result));
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
//                console.log(`Processing array at key ${key}:`, JSON.stringify(value));
                // Preserve arrays as is, just process their contents
                processed[key] = value.map(item => this._flattenObject(item));
//                console.log(`Processed array at key ${key}:`, JSON.stringify(processed[key]));
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
        if (obj === undefined || obj === null) return obj;

        // Handle arrays (including nested)
        if (Array.isArray(obj)) {
//            console.log('Unflattening array:', JSON.stringify(obj));
            const result = obj.map(item => this._unflattenObject(item));
//            console.log('Unflattened array result:', JSON.stringify(result));
            return result;
        }

        // Handle primitive values and Dates/Timestamps
        if (typeof obj !== 'object' || obj instanceof Date || obj instanceof Timestamp) {
            return obj;
        }

        // Handle objects
        const processed = {};
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
//                console.log(`Unflattening array at key ${key}:`, JSON.stringify(value));
                // Preserve arrays as is, just process their contents
                processed[key] = value.map(item => this._unflattenObject(item));
//                console.log(`Unflattened array at key ${key}:`, JSON.stringify(processed[key]));
            } else if (typeof value === 'object' && value !== null) {
                // Only unflatten non-array objects
                const unflattened = unflatten(value, {
                    safe: true,
                    delimiter: '.'
                });
                processed[key] = this._unflattenObject(unflattened);
            } else {
                processed[key] = value;
            }
        }
        return processed;
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

    async find(collection, queryObj) {
        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            
            // Normalize and flatten the query object
            const normalizedQuery = this._normalizeDates(queryObj || {});
            const flattenedQuery = this._flattenObject(normalizedQuery);
            
            let q = this._buildQuery(collectionRef, flattenedQuery);
            const snapshot = await getDocs(q);
            
            // Process results
            const results = snapshot.docs.map(doc => {
                const data = doc.data();
                const unflattened = this._unflattenObject(data);
                const withDates = this._convertFromFirestoreData(unflattened);
                return {
                    ...withDates,
                    _id: doc.id
                };
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
            console.error('Error in find:', error);
            throw error;
        }
    }

    async findOne(collection, queryObj) {
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            // If querying by _id, use direct document reference
            if (queryObj._id) {
                const collectionName = this._getCollectionName(collection);
                const docRef = doc(this.db, collectionName, queryObj._id.toString());
                const docSnap = await getDoc(docRef);
                
                if (!docSnap.exists()) {
                    return null;
                }
                
                const data = docSnap.data();
                return this._convertFromFirestoreData({
                    ...data,
                    _id: docSnap.id
                });
            }

            // Otherwise, use query to find first matching document
            const results = await this.find(collection, queryObj, 1);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Error in findOne:', error);
            throw error;
        }
    }

    async findByUuid(collection, uuid) {
        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            const q = query(collectionRef, where('uuid', '==', uuid), limit(1));

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const document = snapshot.docs[0];
            const data = document.data();
            const unflattened = this._unflattenObject(data);
            const withDates = this._convertFromFirestoreData(unflattened);
            return {
                ...withDates,
                _id: document.id
            };
        } catch (error) {
            console.error('Error in findByUuid:', error);
            throw error;
        }
    }

    async update(collection, queryObj, data) {
        // console.log('FirestoreDbEngine: Updating document in collection:', collection);
        // console.log('');
        // console.log('FirestoreDbEngine: Query:', queryObj);
        // console.log('');
        // console.log('FirestoreDbEngine: Data:', data);
        // console.log('');
        
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            // If updating by _id, use direct document reference
            if (queryObj._id) {
                const collectionName = this._getCollectionName(collection);
                const docRef = doc(this.db, collectionName, queryObj._id.toString());
                
                // Get current document data
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
//                    console.log('Document not found for update');
                    return { modifiedCount: 0 };
                }
                
                // If data has _id, treat it as a document replacement
                if (data._id) {
                    const { _id, ...updateData } = data;
                    await withRetry(() => updateDoc(docRef, this._convertToFirestoreData(updateData)));
                } else {
                    // Otherwise, merge the update
                    await withRetry(() => updateDoc(docRef, this._convertToFirestoreData(data)));
                }
                
//                console.log('Document updated successfully');
                return { modifiedCount: 1 };
            }

            // For non-_id queries, find and update first matching document
            const result = await this.findOne(collection, queryObj);
            if (!result) {
                console.log('No document found matching query');
                return { modifiedCount: 0 };
            }

            // Update the found document
            return this.update(collection, { _id: result._id }, data);
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    async create(collection, data) {
        // console.log('FirestoreDbEngine: Creating document in collection:', collection);
        // console.log('');
        // console.log('FirestoreDbEngine: Current initialization state:', this.initialized);
        // console.log('');
        
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
//            console.log('Creating document with data:', JSON.stringify(data, null, 2));
//            console.log('');
            
            // Convert data to Firestore-compatible format
            const firestoreData = this._convertToFirestoreData(data);
            
            // Get collection reference
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            
            // Create a new document with the specified ID
            const docRef = doc(collectionRef, firestoreData._id.toString());
            
            // Remove _id from the data since it's used as the document ID
            const { _id, ...docData } = firestoreData;
            
            // Set the document data with retry
            await withRetry(() => setDoc(docRef, docData));
            
            // Get fresh data after creation with retry
            const docSnap = await withRetry(() => getDoc(docRef));
            
            // Return the created document data with dates converted back
            return this._convertFromFirestoreData({ _id, ...docSnap.data() });
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    async delete(collection, queryObj) {
        // console.log('FirestoreDbEngine: Deleting documents in collection:', collection);
        // console.log('');
        // console.log('FirestoreDbEngine: Query:', queryObj);
        // console.log('');
        
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            // If deleting by _id, use direct document reference
            if (queryObj._id) {
                const collectionName = this._getCollectionName(collection);
                const docRef = doc(this.db, collectionName, queryObj._id.toString());
                
                // Check if document exists before deletion
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    console.log('Document not found for deletion');
                    return { deletedCount: 0 };
                }
                
                // Attempt to delete the document
                await withRetry(() => deleteDoc(docRef));
                
                // Verify deletion by checking if document still exists
                const verifySnap = await getDoc(docRef);
                if (!verifySnap.exists()) {
//                    console.log('Document deleted successfully');
                    return { deletedCount: 1 };
                } else {
                    console.error('Document still exists after deletion attempt');
                    return { deletedCount: 0 };
                }
            }

            // For other queries, find matching documents and delete them
            const results = await this.find(collection, queryObj);
            const collectionName = this._getCollectionName(collection);
            let deletedCount = 0;

            for (const result of results) {
                const docRef = doc(this.db, collectionName, result._id.toString());
                await withRetry(() => deleteDoc(docRef));
                
                // Verify each deletion
                const verifySnap = await getDoc(docRef);
                if (!verifySnap.exists()) {
                    deletedCount++;
                }
            }

//            console.log(`Deleted ${deletedCount} documents`);
            return { deletedCount };
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    async deleteCollection(collection) {
        // console.log('FirestoreDbEngine: DeleteCollection called, state:', {
        //     initialized: this.initialized,
        //     hasApp: !!this.app,
        //     hasDb: !!this.db
        // });
        // console.log('');
        
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Cannot delete collection - not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            const collectionName = this._getCollectionName(collection);
            console.log(`FirestoreDbEngine: Attempting to delete collection: ${collectionName}`);
            console.log('');
            
            const collectionRef = firestoreCollection(this.db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                // console.log(`FirestoreDbEngine: Collection ${collectionName} is already empty`);
                // console.log('');
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
                // console.log(`FirestoreDbEngine: Deleted batch of ${chunk.length} documents from ${collectionName}`);
                // console.log('');
            }

            // console.log(`FirestoreDbEngine: Successfully deleted collection ${collectionName} (${count} documents)`);
            // console.log('');
            return true;
        } catch (error) {
            console.error(`FirestoreDbEngine: Error deleting collection ${collection}:`, error);
            throw error;
        }
    }

    async disconnect() {
        // console.log('FirestoreDbEngine: Disconnect called, current state:', {
        //     initialized: this.initialized,
        //     hasApp: !!this.app,
        //     hasDb: !!this.db,
        //     hasInitPromise: !!this.initializationPromise
        // });
        // console.log('');
        
        try {
            // Clear database reference
            this.db = null;

            if (this.app) {
                // console.log('FirestoreDbEngine: Attempting to delete Firebase app...');
                // console.log('');
                try {
                    // Use deleteApp from firebase/app instead of app.delete()
                    const { deleteApp } = await import('firebase/app');
                    await deleteApp(this.app);
                    // console.log('FirestoreDbEngine: Firebase app deleted successfully');
                    // console.log('');
                } catch (error) {
                    console.log('FirestoreDbEngine: Error deleting Firebase app:', error.message);
                    console.log('');
                    // Continue cleanup even if app deletion fails
                }
                this.app = null;
            }

            // Reset initialization state
            this.initialized = false;
            this.initializationPromise = null;

            // console.log('FirestoreDbEngine: Cleanup complete, final state:', {
            //     initialized: this.initialized,
            //     hasApp: !!this.app,
            //     hasDb: !!this.db,
            //     hasInitPromise: !!this.initializationPromise
            // });
            // console.log('');
        } catch (error) {
            console.error('FirestoreDbEngine: Error during disconnect:', error);
            throw error;
        }
    }
}