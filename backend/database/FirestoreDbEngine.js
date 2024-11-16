import { BaseDbEngine } from './BaseDbEngine.js';
import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection as firestoreCollection, 
    query, 
    where, 
    orderBy, 
    limit as firestoreLimit,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    setLogLevel,
    Timestamp,
    connectFirestoreEmulator
} from 'firebase/firestore/lite';
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
        try {
        validateDotEnv();
        this.app = initializeApp(firebaseConfig);
        this.db = getFirestore(this.app);
        
        if (process.env.NODE_ENV === 'development') {
            connectFirestoreEmulator(this.db, 'localhost', 8080);
        }
        } catch (error) {
        console.error('Firebase initialization error:', error);
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

    _convertDatesToTimestamps(obj) {
        if (obj === undefined) return null;
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        if (obj instanceof Date) return Timestamp.fromDate(obj);
        if (obj instanceof Timestamp) return obj;

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this._convertDatesToTimestamps(item));
        }

        // Handle objects
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = this._convertDatesToTimestamps(value);
        }
        return converted;
    }

    _convertTimestampsToDates(obj) {
        if (obj === undefined) return null;
        if (obj === null) return null;
        if (typeof obj !== 'object') return obj;
        
        // Convert Timestamp to Date
        if (obj?.seconds !== undefined && obj?.nanoseconds !== undefined) {
            return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000);
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            return obj.map(item => this._convertTimestampsToDates(item));
        }

        // Handle objects
        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = this._convertTimestampsToDates(value);
        }
        return converted;
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
                const withDates = this._convertTimestampsToDates(unflattened);
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
        try {
            if (queryObj._id) {
                const collectionName = this._getCollectionName(collection);
                const docRef = doc(this.db, collectionName, queryObj._id);
                const docSnap = await getDoc(docRef);
                
                if (!docSnap.exists()) {
                    console.log(`Could not find document ${queryObj._id}`);
                    return null;
                }

                const data = docSnap.data();
                const unflattened = this._unflattenObject(data);
                const withDates = this._convertTimestampsToDates(unflattened);
                return {
                    ...withDates,
                    _id: docSnap.id
                };
            }

            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            let q = this._buildQuery(collectionRef, queryObj);
            q = query(q, firestoreLimit(1));

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const document = snapshot.docs[0];
            const data = document.data();
            const unflattened = this._unflattenObject(data);
            const withDates = this._convertTimestampsToDates(unflattened);
            return {
                ...withDates,
                _id: document.id
            };
        } catch (error) {
            console.error('Error in findOne:', error);
            throw error;
        }
    }

    async findByUuid(collection, uuid) {
        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            const q = query(collectionRef, where('uuid', '==', uuid), firestoreLimit(1));

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const document = snapshot.docs[0];
            const data = document.data();
            const unflattened = this._unflattenObject(data);
            const withDates = this._convertTimestampsToDates(unflattened);
            return {
                ...withDates,
                _id: document.id
            };
        } catch (error) {
            console.error('Error in findByUuid:', error);
            throw error;
        }
    }

    async create(collection, data) {
        if (!this.db) throw new Error('Firestore not initialized');

        try {
            console.log('Creating document with data:', JSON.stringify(data, null, 2));
            
            // Normalize dates first
            const normalizedData = this._normalizeDates(data);
            console.log('Normalized data:', JSON.stringify(normalizedData, null, 2));

            // Ensure UUID is generated if not provided
            if (!normalizedData.uuid) {
                normalizedData.uuid = UuidService.generate();
            }

            // Convert normalized dates to Firestore timestamps and flatten
            const timestampData = this._convertDatesToTimestamps(normalizedData);
            console.log('Data with timestamps:', JSON.stringify(timestampData, null, 2));
            
            const flattenedData = this._flattenObject(timestampData);
            console.log('Flattened data:', JSON.stringify(flattenedData, null, 2));

            const collectionName = this._getCollectionName(collection);
            
            // If _id is provided, use setDoc to create document with that ID
            if (normalizedData._id) {
                const docRef = doc(this.db, collectionName, normalizedData._id);
                await setDoc(docRef, flattenedData);
                const docSnap = await getDoc(docRef);
                const savedData = docSnap.data();
                console.log('Saved data:', JSON.stringify(savedData, null, 2));
                
                const unflattened = this._unflattenObject(savedData);
                console.log('Unflattened data:', JSON.stringify(unflattened, null, 2));
                
                const withDates = this._convertTimestampsToDates(unflattened);
                console.log('Data with dates:', JSON.stringify(withDates, null, 2));
                
                return {
                    ...withDates,
                    _id: docRef.id
                };
            }
            
            // Otherwise use addDoc to generate a new ID
            const docRef = await addDoc(firestoreCollection(this.db, collectionName), flattenedData);
            const docSnap = await getDoc(docRef);
            const savedData = docSnap.data();
            console.log('Saved data:', JSON.stringify(savedData, null, 2));
            
            const unflattened = this._unflattenObject(savedData);
            console.log('Unflattened data:', JSON.stringify(unflattened, null, 2));
            
            const withDates = this._convertTimestampsToDates(unflattened);
            console.log('Data with dates:', JSON.stringify(withDates, null, 2));
            
            return {
                ...withDates,
                _id: docRef.id
            };
        } catch (error) {
            console.error('Error in create:', error);
            throw error;
        }
    }

    async update(collection, queryObj, data) {
        if (!this.db) throw new Error('Firestore not initialized');

        try {
            // Get collection reference and build query
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            let q = this._buildQuery(collectionRef, queryObj);
            
            // Normalize dates first
            const normalizedData = this._normalizeDates(data);

            // Convert normalized dates to Firestore timestamps
            const timestampData = this._convertDatesToTimestamps(normalizedData);
            const flattenedData = this._flattenObject(timestampData);

            // Get matching documents
            const snapshot = await getDocs(q);
            
            // If no documents match, return 0 modifications
            if (snapshot.empty) {
                return { modifiedCount: 0 };
            }

            // Perform updates on all matching documents
            const updatePromises = snapshot.docs.map(async (document) => {
                const docRef = doc(this.db, collectionName, document.id);
                await updateDoc(docRef, flattenedData);
            });

            // Wait for all updates to complete
            await Promise.all(updatePromises);

            return { 
                modifiedCount: snapshot.size,
                ...normalizedData 
            };
        } catch (error) {
            console.error('Firestore update error:', error);
            throw error;
        }
    }

    async delete(collection, queryObj) {
        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            let q = this._buildQuery(collectionRef, queryObj);
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                return { deletedCount: 0 };
            }

            let deletedCount = 0;
            
            // Process deletions sequentially to avoid hanging
            for (const document of snapshot.docs) {
                try {
                    const docRef = doc(this.db, collectionName, document.id);
                    // Call deleteDoc without await and increment counter immediately
                    deleteDoc(docRef);
                    deletedCount++;
                } catch (error) {
                    console.error(`Failed to delete document ${document.id}:`, error);
                }
            }

            // Return the count of attempted deletions
            return { deletedCount };
        } catch (error) {
            console.error('Firestore delete error:', error);
            throw error;
        }
    }

    async deleteCollection(collection) {
        if (!this.db) throw new Error('Firestore not initialized');

        try {
            const collectionName = this._getCollectionName(collection);
            const collectionRef = firestoreCollection(this.db, collectionName);
            const snapshot = await getDocs(collectionRef);

            // Delete each document individually since writeBatch has limits
            const deletePromises = snapshot.docs.map(doc => 
                deleteDoc(doc.ref)
            );
            
            await Promise.all(deletePromises);
            console.log(`Deleted collection: ${collectionName}`);
        } catch (error) {
            console.error(`Error deleting collection ${collection}:`, error);
            throw error;
        }
    }

    async disconnect() {
        try {
            console.log('Disconnecting from Firestore...');
            // Firebase Firestore doesn't require explicit disconnection
            // But we can perform cleanup if needed
            this.app = null;
            this.db = null;
        } catch (error) {
            console.error('Error disconnecting from Firestore:', error);
        }
    }
}