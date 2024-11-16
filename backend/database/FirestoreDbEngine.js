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
    Timestamp
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

    _convertDatesToTimestamps(obj) {
        if (!obj) return obj;
        if (obj instanceof Date) return Timestamp.fromDate(obj);
        if (typeof obj !== 'object') return obj;

        const converted = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Date) {
            converted[key] = Timestamp.fromDate(value);
        } else if (value && typeof value === 'object') {
            converted[key] = this._convertDatesToTimestamps(value);
        } else {
            converted[key] = value;
        }
        }
        return converted;
    }

    _convertTimestampsToDates(obj) {
        if (!obj) return obj;
        if (typeof obj !== 'object') return obj;

        if (obj?.seconds !== undefined && obj?.nanoseconds !== undefined) {
        return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000);
        }

        const converted = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
            if (value.seconds !== undefined && value.nanoseconds !== undefined) {
            converted[key] = new Date(value.seconds * 1000 + value.nanoseconds / 1000000);
            } else {
            converted[key] = this._convertTimestampsToDates(value);
            }
        } else {
            converted[key] = value;
        }
        }
        return converted;
    }

    _flattenObject(obj) {
        const flattened = flatten(obj, {
        safe: true,
        delimiter: '.',
        maxDepth: 20
        });
        return this._convertDatesToTimestamps(flattened);
    }

    _unflattenObject(obj) {
        const unflattened = unflatten(obj, {
        safe: true,
        delimiter: '.'
        });
        return this._convertTimestampsToDates(unflattened);
    }

    _getCollectionName(mongooseModel) {
        //    return mongooseModel.collection.collectionName || mongooseModel.modelName.toLowerCase();
            return mongooseModel.modelName.toLowerCase();
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
                switch(operator) {
                    case '$ne':
                    q = query(q, where(key, '!=', 
                        operandValue instanceof Date ? 
                        Timestamp.fromDate(operandValue) : 
                        operandValue
                    ));
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

    async find(mongooseModel, queryObj) {
        try {
        const collectionName = this._getCollectionName(mongooseModel);
        const collectionRef = firestoreCollection(this.db, collectionName);
        let q = this._buildQuery(collectionRef, queryObj);

        const snapshot = await getDocs(q);
        const results = snapshot.docs.map(doc => 
            this._initializeData(mongooseModel, {
            ...this._unflattenObject(doc.data()),
            _id: doc.id
            })
        );

        return {
            sort: (sortCriteria) => {
            if (typeof sortCriteria === 'function') {
                results.sort(sortCriteria);
            } else {
                const [field, order] = Object.entries(sortCriteria)[0];
                q = query(q, orderBy(field, order === -1 ? 'desc' : 'asc'));
            }
            return {
                limit: (n) => results.slice(0, n)
            };
            },
            limit: (n) => results.slice(0, n),
            then: (resolve) => resolve(results)
        };
        } catch (error) {
        console.error('Firestore find error:', error);
        throw error;
        }
    }

    async findOne(mongooseModel, queryObj) {
        try {
        if (queryObj._id) {
            const collectionName = this._getCollectionName(mongooseModel);
            const docRef = doc(this.db, collectionName, queryObj._id);
            const docSnap = await getDoc(docRef);
            
            if (!docSnap.exists()) {
            console.log(`Could not find document ${queryObj._id}`);
            return null;
            }

            return this._initializeData(mongooseModel, {
            ...this._unflattenObject(docSnap.data()),
            _id: docSnap.id
            });
        }

        const collectionName = this._getCollectionName(mongooseModel);
        const collectionRef = firestoreCollection(this.db, collectionName);
        let q = this._buildQuery(collectionRef, queryObj);
        q = query(q, firestoreLimit(1));

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const document = snapshot.docs[0];
        return this._initializeData(mongooseModel, {
            ...this._unflattenObject(document.data()),
            _id: document.id
        });
        } catch (error) {
        console.error('Firestore findOne error:', error);
        throw error;
        }
    }

    async findByUuid(mongooseModel, uuid) {
        try {
            const collectionName = this._getCollectionName(mongooseModel);
            const collectionRef = firestoreCollection(this.db, collectionName);
            const q = query(collectionRef, where('uuid', '==', uuid), firestoreLimit(1));

            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const document = snapshot.docs[0];
            return this._initializeData(mongooseModel, {
                ...this._unflattenObject(document.data()),
                _id: document.id
            });
        } catch (error) {
            console.error('Firestore findByUuid error:', error);
            throw error;
        }
    }

    async create(mongooseModel, data) {
        if (!this.db) throw new Error('Firestore not initialized');

        // Normalize dates first
        const normalizedData = this._normalizeDates(data);

        // Ensure UUID is generated if not provided
        if (!normalizedData.uuid) {
            normalizedData.uuid = UuidService.generate();
        }

        // Convert normalized dates to Firestore timestamps
        const timestampData = this._convertDatesToTimestamps(normalizedData);

        const collectionName = mongooseModel.modelName.toLowerCase();
        const docRef = await addDoc(firestoreCollection(this.db, collectionName), timestampData);
        
        return { 
            ...normalizedData, 
            _id: docRef.id 
        };
    }

    async update(mongooseModel, queryObj, data) {
        if (!this.db) throw new Error('Firestore not initialized');

        try {
            // Get collection reference and build query
            const collectionName = this._getCollectionName(mongooseModel);
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

    async delete(mongooseModel, queryObj) {
        try {
        const collectionName = this._getCollectionName(mongooseModel);
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