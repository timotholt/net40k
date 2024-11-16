// Test framework imports
import assert from 'assert';

// Project imports
import { UserDB } from '../models/User.js';
import { GameStateDB } from '../models/GameState.js';
import { ChatDB } from '../models/Chat.js';
import { UuidService } from '../services/UuidService.js';
import DateService from '../services/DateService.js';
import { db } from '../database/database.js';
import { testUsers, testGames, createTestChats } from './testData.js';

// Export the main test function
export async function testAllDatabaseFunctions() {
    console.log('🚀 Starting Comprehensive Database Tests...');

    try {
        // Test User Creation and Operations
        console.log('📝 Testing User Creation...');
        const testUser = await UserDB.create({
            username: 'testuser',
            nickname: 'Test User',
            password: 'password123'
        });
        console.log(`✅ User Created: ${testUser.userId}`);
        assert(testUser.userId, 'User creation failed: No userId generated');
        assert.strictEqual(testUser.username, 'testuser', 'Incorrect username');
        assert.strictEqual(testUser.nickname, 'Test User', 'Incorrect nickname');
        assert(!testUser.isDeleted, 'User should not be deleted');

        // Test User Retrieval
        console.log('🔍 Testing User Retrieval...');
        const foundUser = await UserDB.findById(testUser.userId);
        console.log(`✅ User Retrieved: ${foundUser.username}`);
        assert(foundUser, 'User not found after creation');
        assert.strictEqual(foundUser.username, 'testuser', 'Retrieved user has incorrect username');

        // Test GameState Creation and Operations
        console.log('🎲 Testing GameState Creation...');
        const testGame = await GameStateDB.create({
            name: 'Test Game',
            creatorId: testUser.userId,
            maxPlayers: 4
        });
        console.log(`✅ Game Created: ${testGame.gameId}`);
        assert(testGame.gameId, 'Game creation failed: No gameId generated');
        assert.strictEqual(testGame.name, 'Test Game', 'Incorrect game name');
        assert.strictEqual(testGame.creatorId, testUser.userId, 'Incorrect game creator');
        assert.strictEqual(testGame.playerIds.length, 0, 'Player list should be empty');

        // Test Game Retrieval
        console.log('🔎 Testing GameState Retrieval...');
        const foundGame = await GameStateDB.findOne({ gameId: testGame.gameId });
        console.log(`✅ Game Retrieved: ${foundGame.name}`);
        assert(foundGame, 'Game not found after creation');
        assert.strictEqual(foundGame.name, 'Test Game', 'Retrieved game has incorrect name');

        // Test Chat Creation and Operations
        console.log('💬 Testing Chat Creation...');
        const testChat = await ChatDB.create({
            type: 'game',
            userId: testUser.userId,
            gameId: testGame.gameId,
            username: testUser.username,
            nickname: testUser.nickname,
            message: 'Hello, world!'
        });
        console.log(`✅ Chat Created: ${testChat.chatId}`);
        assert(testChat.chatId, 'Chat creation failed: No chatId generated');
        assert.strictEqual(testChat.type, 'game', 'Incorrect chat type');
        assert.strictEqual(testChat.userId, testUser.userId, 'Incorrect chat user');
        assert.strictEqual(testChat.message, 'Hello, world!', 'Incorrect chat message');

        // Test Chat Retrieval
        console.log('🕵️ Testing Chat Retrieval...');
        const foundChat = await ChatDB.findOne({ chatId: testChat.chatId });
        console.log(`✅ Chat Retrieved: ${foundChat.message}`);
        assert(foundChat, 'Chat not found');
        assert.strictEqual(foundChat.message, 'Hello, world!', 'Incorrect chat message');

        // Cleanup
        console.log('🧹 Performing Cleanup...');
        await UserDB.delete({ userId: testUser.userId });
        await GameStateDB.delete({ gameId: testGame.gameId });
        await ChatDB.delete({ chatId: testChat.chatId });
        console.log('✨ Cleanup Complete');

        console.log('🎉 Database Tests Completed Successfully!');
    } catch (error) {
        console.error('❌ Database Tests Failed:', error);
        throw error;
    }
}
