import { db } from '../database/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function testDatabaseEngine() {
    console.log('Starting database test and data loading...');

    try {
        // Initialize database connection
        if (!db.isConnected()) {
            console.log('Initializing database connection...');
            await db.init();
        }

        // Read JSON files
        const chatData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hack40k.chat.json'), 'utf8'));
        const gamestateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hack40k.gamestate.json'), 'utf8'));
        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hack40k.user.json'), 'utf8'));

        console.log(`Loaded ${chatData.length} chat records`);
        console.log(`Loaded ${gamestateData.length} gamestate records`);
        console.log(`Loaded ${userData.length} user records`);

        // Create collections and insert data
        console.log('Creating collections and inserting data...');

        // Insert users
        for (const user of userData) {
            await db.create('user', user);
        }
        console.log('✅ Users loaded successfully');

        // Insert game states
        for (const gamestate of gamestateData) {
            await db.create('gamestate', gamestate);
        }
        console.log('✅ Game states loaded successfully');

        // Insert chat messages
        for (const chat of chatData) {
            await db.create('chat', chat);
        }
        console.log('✅ Chat messages loaded successfully');

        console.log('Database test and data loading completed successfully');
        return true;
    } catch (error) {
        console.error('Error in database test:', error);
        throw error;
    }
}
