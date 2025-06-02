import assert from 'assert';
// import { UserDB } from '../models/User.js';
// import { GameStateDB } from '../models/GameState.js';
// import { ChatDB } from '../models/Chat.js';
import { createUserUuid, createGameUuid, createMessageUuid } from '../../shared/constants/GameUuids.js';
// import { GAME_PHASES } from '../models/GameState.js';
import { db } from '../database/database.js';

async function serviceTestUserOperations() {
    console.log('🧪 Testing User Operations...');
    
    try {
        // Test User Creation
        const testUser = {
            username: 'testuser_' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'password123',
            nickname: 'Test User'
        };

        // Create User
        console.log('📝 Testing User Creation...');
        const createdUser = await UserDB.create(testUser);
        assert(createdUser, 'User creation failed');
        assert(createdUser.userUuid, 'User UUID not generated');
        
        // Find User
        console.log('🔍 Testing User Retrieval...');
        const foundUser = await UserDB.findById(createdUser.userUuid);
        assert(foundUser, 'User not found after creation');
        assert.strictEqual(foundUser.username, testUser.username, 'Username mismatch');
        assert.strictEqual(foundUser.email, testUser.email, 'Email mismatch');
        
        // Update User
        console.log('✏️ Testing User Update...');
        const updateResult = await UserDB.verify(createdUser.verificationToken);
        assert(updateResult, 'User verification failed');
        
        const updatedUser = await UserDB.findById(createdUser.userUuid);
        assert(updatedUser.isVerified, 'User verification status not updated');

        // Test User Ban/Unban
        console.log('🚫 Testing User Ban...');
        await UserDB.ban(createdUser.userUuid, 'Test ban');
        const bannedUser = await UserDB.findById(createdUser.userUuid);
        assert(bannedUser.isBanned, 'User ban failed');
        assert.strictEqual(bannedUser.banReason, 'Test ban', 'Ban reason not set');

        console.log('✅ Testing User Unban...');
        await UserDB.unban(createdUser.userUuid);
        const unbannedUser = await UserDB.findById(createdUser.userUuid);
        assert(!unbannedUser.isBanned, 'User unban failed');
        
        return createdUser;
    } catch (error) {
        console.error('❌ User Operations Tests Failed:', error);
        throw error;
    }
}

async function serviceTestGameOperations(testUser) {
    console.log('🧪 Testing Game Operations...');
    
    try {
        // Test Game Creation
        const testGame = {
            name: 'Test Game ' + Date.now(),
            phase: GAME_PHASES.SETUP,
            creatorUuid: testUser.userUuid
        };

        // Create Game
        console.log('📝 Testing Game Creation...');
        const createdGame = await GameStateDB.create(testGame);
        assert(createdGame, 'Game creation failed');
        assert(createdGame.gameUuid, 'Game UUID not generated');
        
        // Find Game
        console.log('🔍 Testing Game Retrieval...');
        const foundGame = await GameStateDB.findById(createdGame.gameUuid);
        assert(foundGame, 'Game not found after creation');
        assert.strictEqual(foundGame.name, testGame.name, 'Game name mismatch');
        
        // Update Game Phase
        console.log('✏️ Testing Game Phase Update...');
        await GameStateDB.setPhase(createdGame.gameUuid, GAME_PHASES.PHASE_CHARACTER_CREATION);
        const updatedGame = await GameStateDB.findById(createdGame.gameUuid);
        assert.strictEqual(updatedGame.phase, GAME_PHASES.PHASE_CHARACTER_CREATION, 'Game phase update failed');

        // Test Spectator Management
        console.log('👥 Testing Spectator Management...');
        await GameStateDB.addSpectator(createdGame.gameUuid, testUser.userUuid);
        const gameWithSpectator = await GameStateDB.findById(createdGame.gameUuid);
        assert(gameWithSpectator.spectatorsUuid.includes(testUser.userUuid), 'Adding spectator failed');

        await GameStateDB.removeSpectator(createdGame.gameUuid, testUser.userUuid);
        const gameWithoutSpectator = await GameStateDB.findById(createdGame.gameUuid);
        assert(!gameWithoutSpectator.spectatorsUuid.includes(testUser.userUuid), 'Removing spectator failed');
        
        return createdGame;
    } catch (error) {
        console.error('❌ Game Operations Tests Failed:', error);
        throw error;
    }
}

async function serviceTesttMessageOperations(testUser, testGame) {
    console.log('🧪 Testing Message Operations...');
    
    try {
        // Test Message Creation
        const testMessage = {
            gameUuid: testGame.gameUuid,
            userUuid: testUser.userUuid,
            content: 'Test message ' + Date.now()
        };

        // Create Message
        console.log('📝 Testing Message Creation...');
        const createdMessage = await ChatDB.create(testMessage);
        assert(createdMessage, 'Message creation failed');
        assert(createdMessage.messageUuid, 'Message UUID not generated');
        
        // Find Message
        console.log('🔍 Testing Message Retrieval...');
        const foundMessage = await ChatDB.findById(createdMessage.messageUuid);
        assert(foundMessage, 'Message not found after creation');
        assert.strictEqual(foundMessage.content, testMessage.content, 'Message content mismatch');

        // Find Game Messages
        console.log('🔍 Testing Game Messages Retrieval...');
        const gameMessages = await ChatDB.findByGame(testGame.gameUuid);
        assert(gameMessages.length > 0, 'No messages found for game');
        assert(gameMessages.some(msg => msg.messageUuid === createdMessage.messageUuid), 'Created message not found in game messages');
        
        return createdMessage;
    } catch (error) {
        console.error('❌ Message Operations Tests Failed:', error);
        throw error;
    }
}

async function serviceTestErrorHandling() {
    console.log('🧪 Testing Error Handling...');
    
    try {
        // Test Invalid User Creation
        console.log('📝 Testing Invalid User Creation...');
        const invalidUser = {
            // Missing required fields
            username: 'invalid_user'
        };
        
        try {
            await UserDB.create(invalidUser);
            assert.fail('Should have thrown validation error');
        } catch (error) {
            assert(error, 'Expected validation error');
        }
        
        // Test Invalid Game Update
        console.log('✏️ Testing Invalid Game Update...');
        try {
            await GameStateDB.updatePhase('non_existent_game', GAME_PHASES.DEPLOYMENT);
            assert.fail('Should have thrown not found error');
        } catch (error) {
            assert(error, 'Expected not found error');
        }

        // Test Invalid Message Creation
        console.log('📝 Testing Invalid Message Creation...');
        try {
            await ChatDB.create({
                content: 'Invalid message',
                // Missing required gameUuid and userUuid
            });
            assert.fail('Should have thrown validation error');
        } catch (error) {
            assert(error, 'Expected validation error');
        }
    } catch (error) {
        console.error('❌ Error Handling Tests Failed:', error);
        throw error;
    }
}

// Initialize database connection and run tests
async function runTests() {
    try {
        await db.connect();
        
        console.log('🚀 Starting Database Tests...');
        
        const testUser = await serviceTestUserOperations();
        console.log('✅ User Operations Tests Passed\n');
        
        const testGame = await serviceTestGameOperations(testUser);
        console.log('✅ Game Operations Tests Passed\n');
        
        await serviceTestMessageOperations(testUser, testGame);
        console.log('✅ Message Operations Tests Passed\n');
        
        await serviceTestErrorHandling();
        console.log('✅ Error Handling Tests Passed\n');
        
        console.log('🎉 All Tests Passed Successfully!');
    } catch (error) {
        console.error('❌ Tests Failed:', error);
        throw error;
    } finally {
        await db.disconnect();
    }
}

// Export test functions
export async function serviceTestAllDatabaseFunctions() {
    console.log('🚀 Starting Database Tests...');
    
    // Initialize database
    await db.init();
    
    try {
        await runTests();
        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Tests failed:', error);
        throw error;
    }
}

// Only run tests if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    serviceTestAllDatabaseFunctions();
}
