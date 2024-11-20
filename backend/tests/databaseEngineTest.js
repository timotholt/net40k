import assert from 'assert';
import { db } from '../database/database.js';

// Test utilities
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${timestamp} ${prefix} ${message}`);
}

async function runTest(testName, testFn) {
    log(`Running: ${testName}`);
    try {
        await testFn();
        log(`Passed: ${testName}`, 'success');
        return true;
    } catch (error) {
        log(`Failed: ${testName}`, 'error');
        console.error('Error:', error);
        return false;
    }
}

// Test username queries
async function testUsernameQueries() {
    const testUsers = [
        {
            username: 'TestUser123',
            password: 'password123',
            nickname: 'Test User 1'
        },
        {
            username: 'testuser123',  // Same as above but different case
            password: 'password456',
            nickname: 'Test User 2'
        },
        {
            username: 'TestUser456',
            password: 'password789',
            nickname: 'Test User 3'
        }
    ];

    try {
        // Create test users
        for (const user of testUsers) {
            await db.create('user', user);
        }

        // Test exact match query
        const exactMatch = await db.findOne('user', { username: 'TestUser123' });
        assert(exactMatch, 'Failed to find exact username match');
        assert.strictEqual(exactMatch.username, 'TestUser123', 'Username mismatch in exact query');

        // Test case sensitivity
        const caseMatch = await db.findOne('user', { username: 'testuser123' });
        assert(caseMatch, 'Failed to find case-sensitive username match');
        assert.strictEqual(caseMatch.username, 'testuser123', 'Username mismatch in case-sensitive query');

        // Test finding multiple similar usernames
        const similarUsers = await db.find('user', { username: { $regex: /testuser/i } });
        assert(Array.isArray(similarUsers), 'Failed to get array of similar usernames');
        assert(similarUsers.length >= 2, 'Failed to find all similar usernames');

        // Test non-existent username
        const nonExistent = await db.findOne('user', { username: 'NonExistentUser' });
        assert(!nonExistent, 'Should not find non-existent username');

        // Cleanup test users
        for (const user of testUsers) {
            await db.delete('user', { username: user.username });
        }

    } catch (error) {
        throw error;
    }
}

// Main test runner
async function runDatabaseTests() {
    try {
        await db.init();
        await runTest('Username Query Tests', testUsernameQueries);
        await db.disconnect();
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runDatabaseTests();
}

export { runDatabaseTests };
