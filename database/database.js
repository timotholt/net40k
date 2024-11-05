import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { getDbEngine } from './selectDbEngine.js';

dotenv.config();

class Database {
  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    this.dbEngine = null;
    Database.instance = this;
  }

  isConnected() {
    return (this.dbEngine != null);
  }

  async connect() {
    if (this.dbEngine) {
      return this.dbEngine;
    }

    try {
      const dbType = process.env.DB_TYPE || 'memory';
      console.log(`Connecting to database type: ${dbType}`);
      
      this.dbEngine = getDbEngine(dbType);
      
      if (dbType === 'mongodb') {
        await this._connectMongoDB();
      } else if (dbType === 'firestore') {
        // Firestore connection is handled in the FirestoreDbEngine constructor
        console.log('Connected to Firestore');
      } else {
        console.log('Using in-memory database');
      }
      
      return this.dbEngine;
    } catch (error) {
      console.error('Database connection error:', error);
      // Fall back to in-memory database if connection fails
      console.log('Falling back to in-memory database');
      this.dbEngine = getDbEngine('memory');
      return this.dbEngine;
    }
  }

  async _connectMongoDB() {
    try {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB Connected...');

      mongoose.connection.on('error', err => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(() => this._connectMongoDB(), 5000);
      });
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      throw error;
    }
  }

  getEngine() {
    return this.dbEngine;
  }
}

export const db = new Database();