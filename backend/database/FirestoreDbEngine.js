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
    connectFirestoreEmulator,
    setLogLevel,
    Timestamp
} from 'firebase/firestore';
import dotenv from 'dotenv';
import { flatten, unflatten } from 'flat';
import { UuidService } from '../services/UuidService.js'; 

dotenv.config();

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
        this.initialized = false;
        try {
            validateDotEnv();
        } catch (error) {
            console.error('Firebase env validation error:', error);
            throw error;
        }
    }

    async connect() {
        console.log('FirestoreDbEngine: Attempting to connect...');
        try {
            if (!this.app) {
                console.log('FirestoreDbEngine: Initializing Firebase app...');
                this.app = initializeApp(firebaseConfig);
            }

            if (!this.db) {
                console.log('FirestoreDbEngine: Initializing new Firestore instance...');
                this.db = getFirestore(this.app);
                
                if (process.env.NODE_ENV === 'development') {
                    connectFirestoreEmulator(this.db, 'localhost', 8080);
                }
                
                // Suppress BloomFilter warnings
                setLogLevel('error');
                
                console.log('FirestoreDbEngine: Firestore instance created successfully');
            } else {
                console.log('FirestoreDbEngine: Reusing existing Firestore instance');
            }
            
            this.initialized = true;
            console.log('FirestoreDbEngine: Connection successful, initialized =', this.initialized);
            return true;
        } catch (error) {
            console.error('FirestoreDbEngine: Connection failed:', error);
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
            console.log('Flattening array:', JSON.stringify(obj));
            const result = obj.map(item => this._flattenObject(item));
            console.log('Flattened array result:', JSON.stringify(result));
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
                console.log(`Processing array at key ${key}:`, JSON.stringify(value));
                // Preserve arrays as is, just process their contents
                processed[key] = value.map(item => this._flattenObject(item));
                console.log(`Processed array at key ${key}:`, JSON.stringify(processed[key]));
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
            console.log('Unflattening array:', JSON.stringify(obj));
            const result = obj.map(item => this._unflattenObject(item));
            console.log('Unflattened array result:', JSON.stringify(result));
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
                console.log(`Unflattening array at key ${key}:`, JSON.stringify(value));
                // Preserve arrays as is, just process their contents
                processed[key] = value.map(item => this._unflattenObject(item));
                console.log(`Unflattened array at key ${key}:`, JSON.stringify(processed[key]));
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
        console.log('FirestoreDbEngine: Updating document in collection:', collection);
        console.log('FirestoreDbEngine: Query:', queryObj);
        console.log('FirestoreDbEngine: Data:', data);
        
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
                    console.log('Document not found for update');
                    return { modifiedCount: 0 };
                }
                
                // Merge new data with existing data
                await updateDoc(docRef, this._convertToFirestoreData(data));
                console.log('Document updated successfully');
                return { modifiedCount: 1 };
            }

            // For other queries, find matching documents and update them
            const results = await this.find(collection, queryObj);
            const collectionName = this._getCollectionName(collection);
            let modifiedCount = 0;

            for (const result of results) {
                const docRef = doc(this.db, collectionName, result._id.toString());
                await updateDoc(docRef, this._convertToFirestoreData(data));
                modifiedCount++;
            }

            return { modifiedCount };
        } catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }

    async create(collection, data) {
        console.log('FirestoreDbEngine: Creating document in collection:', collection);
        console.log('FirestoreDbEngine: Current initialization state:', this.initialized);
        
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            console.log('Creating document with data:', JSON.stringify(data, null, 2));
            
            // Convert data to Firestore-compatible format
            const firestoreData = this._convertToFirestoreData(data);
            
            // Get collection reference
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            
            // Create a new document with the specified ID
            const docRef = doc(collectionRef, firestoreData._id.toString());
            
            // Remove _id from the data since it's used as the document ID
            const { _id, ...docData } = firestoreData;
            
            // Set the document data
            await setDoc(docRef, docData);
            
            // Return the created document data with dates converted back
            return this._convertFromFirestoreData({ _id, ...docData });
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    async delete(collection, queryObj) {
        console.log('FirestoreDbEngine: Deleting documents in collection:', collection);
        console.log('FirestoreDbEngine: Query:', queryObj);
        
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
                await deleteDoc(docRef);
                
                // Verify deletion by checking if document still exists
                const verifySnap = await getDoc(docRef);
                if (!verifySnap.exists()) {
                    console.log('Document deleted successfully');
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
                await deleteDoc(docRef);
                
                // Verify each deletion
                const verifySnap = await getDoc(docRef);
                if (!verifySnap.exists()) {
                    deletedCount++;
                }
            }

            console.log(`Deleted ${deletedCount} documents`);
            return { deletedCount };
        } catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }

    async deleteCollection(collection) {
        console.log('FirestoreDbEngine: Deleting collection:', collection);
        console.log('FirestoreDbEngine: Current initialization state:', this.initialized);
        
        if (!this.initialized || !this.db) {
            console.error('FirestoreDbEngine: Not initialized');
            throw new Error('Firestore not initialized');
        }

        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            
            // Get all documents in the collection
            const snapshot = await getDocs(collectionRef);
            
            if (snapshot.empty) {
                console.log(`Collection ${collectionName} is already empty`);
                return true;
            }

            // Delete documents in batches (Firestore limit is 500 operations per batch)
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

                await batch.commit();
                console.log(`Deleted batch of ${chunk.length} documents from ${collectionName}`);
            }

            console.log(`Deleted collection: ${collectionName} (${count} documents)`);
            return true;
        } catch (error) {
            console.error(`Error deleting collection ${collection}:`, error);
            throw error;
        }
    }

    async disconnect() {
        console.log('FirestoreDbEngine: Disconnecting...');
        if (this.db) {
            // Firebase doesn't have a direct disconnect method, but we can clean up our state
            this.db = null;
            this.app = null;
            this.initialized = false;
            console.log('FirestoreDbEngine: Disconnected and cleaned up');
        }
    }
}