import { db } from '../database/database.js';

// Global setup before tests
export async function setup() {
  // Ensure database connection
  if (!db.isConnected()) {
    await db.connect();
  }
}

// Global teardown after tests
export async function teardown() {
  // Close database connection
  if (db.isConnected()) {
    await db.disconnect();
  }
}

// Run setup before tests
setup();
