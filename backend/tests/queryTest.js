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

// Enhanced query operations test with username search
async function testQueryOperations() {
    try {
        // Create test users with various username patterns
        const testUsers = [
            {
                username: 'JohnDoe',
                password: 'password123',
                nickname: 'John'
            },
            {
                username: 'johndoe2',
                password: 'password456',
                nickname: 'John2'
            },
            {
                username: 'JOHNDOE3',
                password: 'password789',
                nickname: 'John3'
            },
            {
                username: 'jane_doe',
                password: 'password101',
                nickname: 'Jane'
            }
        ];

        // Insert test users
        for (const user of testUsers) {
            await db.create('user', user);
        }

        // Test 1: Exact match query
        const exactMatch = await db.findOne('user', { username: 'JohnDoe' });
        assert(exactMatch, 'Should find exact username match');
        assert.strictEqual(exactMatch.username, 'JohnDoe', 'Username should match exactly');

        // Test 2: Case-sensitive queries
        const lowerCase = await db.findOne('user', { username: 'johndoe2' });
        assert(lowerCase, 'Should find lowercase username');
        const upperCase = await db.findOne('user', { username: 'JOHNDOE3' });
        assert(upperCase, 'Should find uppercase username');

        // Test 3: Pattern matching (if supported by the database engine)
        const johnUsers = await db.find('user', { 
            username: { 
                $regex: /john/i 
            } 
        });
        assert(johnUsers.length >= 3, 'Should find all John variations');

        // Test 4: Special character handling
        const specialChar = await db.findOne('user', { username: 'jane_doe' });
        assert(specialChar, 'Should handle usernames with special characters');
        assert.strictEqual(specialChar.username, 'jane_doe', 'Special characters should be preserved');

        // Test 5: Non-existent username
        const nonExistent = await db.findOne('user', { username: 'nonexistent' });
        assert(!nonExistent, 'Should not find non-existent username');

        // Test 6: Multiple criteria query
        const multiCriteria = await db.find('user', {
            username: { $regex: /john/i },
            nickname: { $regex: /John/ }
        });
        assert(multiCriteria.length >= 2, 'Should find users matching both username and nickname patterns');

        // Cleanup
        for (const user of testUsers) {
            await db.delete('user', { username: user.username });
        }

        log('Username query tests completed successfully', 'success');
    } catch (error) {
        log('Error in username query tests', 'error');
        throw error;
    }
}

// Run tests
async function runQueryTests() {
    try {
        await db.init();
        await runTest('Enhanced Query Operations', testQueryOperations);
        await db.disconnect();
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runQueryTests();
}

export { runQueryTests };
