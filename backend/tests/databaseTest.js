import { db } from '../database/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test utilities
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${timestamp} ${prefix} ${message}`);
}

async function runTest(testName, testFn) {
    log(`Starting test: ${testName}`);
    try {
        await testFn();
        log(`Test passed: ${testName}`, 'success');
        return true;
    } catch (error) {
        log(`Test failed: ${testName}`, 'error');
        console.error('Error details:', error);
        return false;
    }
}

// Cleanup utility
async function cleanupCollections() {
    log('Cleaning up test collections...');
    const collections = [
        'test_collection',
        'test_dates',
        'test_arrays',
        'test_queries',
        'user',
        'gamestate',
        'chat'
    ];

    for (const collection of collections) {
        try {
            await db.deleteCollection(collection);
            
            // Verify deletion by attempting to find documents
            const remainingDocs = await db.find(collection, {});
            if (remainingDocs && remainingDocs.length > 0) {
                throw new Error(`Collection ${collection} was not fully deleted. ${remainingDocs.length} documents remain.`);
            }
            log(`✓ Verified ${collection} is empty`);
        } catch (error) {
            console.error(`Error cleaning up collection ${collection}:`, error);
        }
    }
    log('Cleanup complete');
}

// Database clear function for external use
export async function clearDatabase() {
    try {
        log('Initializing database connection...');
        await db.init();
        
        log('Starting database cleanup...');
        await cleanupCollections();
        
        log('Database cleanup completed successfully');
        return true;
    } catch (error) {
        console.error('Failed to clear database:', error);
        throw error;
    } finally {
        try {
            await db.disconnect();
        } catch (error) {
            console.error('Error disconnecting from database:', error);
        }
    }
}

// Database initialization test
async function testDatabaseInitialization() {
    assert(!db.isConnected(), 'Database should not be connected initially');
    await db.init();
    assert(db.isConnected(), 'Database should be connected after initialization');
}

// Basic CRUD operations test
async function testBasicCRUD() {
    const testData = {
        _id: 'test-crud-1',
        name: 'Test Item',
        created: new Date(),
        tags: ['test', 'crud'],
        nested: { field: 'value' }
    };

    // Create
    const created = await db.create('test_collection', testData);
    assert(created._id === testData._id, 'Created item should have the same ID');

    // Read
    const found = await db.findOne('test_collection', { _id: testData._id });
    assert(found.name === testData.name, 'Found item should match created item');
    assert(found.created instanceof Date, 'Date should be properly deserialized');
    assert(Array.isArray(found.tags), 'Arrays should be preserved');
    assert(found.nested.field === 'value', 'Nested objects should be preserved');

    // Update
    const updateData = { name: 'Updated Item' };
    await db.update('test_collection', { _id: testData._id }, updateData);
    const updated = await db.findOne('test_collection', { _id: testData._id });
    assert(updated.name === 'Updated Item', 'Item should be updated');

    // Delete
    await db.delete('test_collection', { _id: testData._id });
    const deleted = await db.findOne('test_collection', { _id: testData._id });
    assert(!deleted, 'Item should be deleted');
}

// Date handling test
async function testDateHandling() {
    const dates = {
        _id: 'test-dates',
        current: new Date(),
        past: new Date('2020-01-01'),
        future: new Date('2025-12-31'),
        timestamp: Date.now()
    };

    await db.create('test_dates', dates);
    const retrieved = await db.findOne('test_dates', { _id: 'test-dates' });

    assert(retrieved.current instanceof Date, 'Current date should be a Date object');
    assert(retrieved.past instanceof Date, 'Past date should be a Date object');
    assert(retrieved.future instanceof Date, 'Future date should be a Date object');
    assert(typeof retrieved.timestamp === 'number', 'Timestamp should remain a number');

    // Test date comparisons
    assert(retrieved.past < retrieved.current, 'Date comparisons should work');
    assert(retrieved.future > retrieved.current, 'Date comparisons should work');
}

// Array handling test
async function testArrayHandling() {
    const arrayData = {
        _id: 'test-arrays',
        emptyArray: [],
        numberArray: [1, 2, 3],
        objectArray: [{ id: 1 }, { id: 2 }],
        nestedArrays: [[1, 2], [3, 4]]
    };

    console.log('Original array data:', JSON.stringify(arrayData, null, 2));
    await db.create('test_arrays', arrayData);
    const retrieved = await db.findOne('test_arrays', { _id: 'test-arrays' });
    console.log('Retrieved array data:', JSON.stringify(retrieved, null, 2));

    assert(Array.isArray(retrieved.emptyArray), 'Empty arrays should be preserved');
    assert(retrieved.numberArray.length === 3, 'Number arrays should be preserved');
    assert(retrieved.objectArray[0].id === 1, 'Object arrays should be preserved');
    console.log('Nested arrays type:', Array.isArray(retrieved.nestedArrays));
    console.log('First nested array type:', Array.isArray(retrieved.nestedArrays[0]));
    console.log('Nested arrays value:', JSON.stringify(retrieved.nestedArrays, null, 2));
    assert(Array.isArray(retrieved.nestedArrays[0]), 'Nested arrays should be preserved');
}

// Query operations test
async function testQueryOperations() {
    // Create test data
    const items = [
        { _id: 'query-1', value: 10, category: 'A' },
        { _id: 'query-2', value: 20, category: 'A' },
        { _id: 'query-3', value: 30, category: 'B' }
    ];

    for (const item of items) {
        await db.create('test_queries', item);
    }

    // Test different queries
    const categoryA = await db.find('test_queries', { category: 'A' });
    assert(categoryA.length === 2, 'Should find 2 items in category A');

    const highValue = await db.find('test_queries', { value: { $gt: 20 } });
    assert(highValue.length === 1, 'Should find 1 item with value > 20');
}

// Load test data from JSON files
async function testLoadJsonData() {
    try {
        const chatData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hack40k.chat.json'), 'utf8'));
        const gamestateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hack40k.gamestate.json'), 'utf8'));
        const userData = JSON.parse(fs.readFileSync(path.join(__dirname, 'hack40k.user.json'), 'utf8'));

        log(`Loading ${userData.length} users...`);
        for (const user of userData) {
            await db.create('user', user);
        }

        log(`Loading ${gamestateData.length} game states...`);
        for (const gamestate of gamestateData) {
            await db.create('gamestate', gamestate);
        }

        log(`Loading ${chatData.length} chat messages...`);
        for (const chat of chatData) {
            await db.create('chat', chat);
        }

        // Verify data integrity
        const userCount = (await db.find('user', {})).length;
        const gamestateCount = (await db.find('gamestate', {})).length;
        const chatCount = (await db.find('chat', {})).length;

        assert(userCount === userData.length, 'All users should be loaded');
        assert(gamestateCount === gamestateData.length, 'All game states should be loaded');
        assert(chatCount === chatData.length, 'All chat messages should be loaded');
    } catch (error) {
        log('Error loading JSON data', 'error');
        throw error;
    }
}

// Main test runner
export async function testDatabaseEngine() {
    log('Starting database engine tests...');
    
    const tests = [
        { name: 'Database Initialization', fn: testDatabaseInitialization },
        { name: 'Basic CRUD Operations', fn: testBasicCRUD },
        { name: 'Date Handling', fn: testDateHandling },
        { name: 'Array Handling', fn: testArrayHandling },
        { name: 'Query Operations', fn: testQueryOperations },
        { name: 'JSON Data Loading', fn: testLoadJsonData }
    ];

    // Run initialization test first
    const initTest = tests[0];
    const initPassed = await runTest(initTest.name, initTest.fn);
    const results = [{ name: initTest.name, passed: initPassed }];

    if (initPassed) {
        // Now that initialization test is done, clean up collections
        await cleanupCollections();
        
        // Run remaining tests
        for (let i = 1; i < tests.length; i++) {
            const test = tests[i];
            const passed = await runTest(test.name, test.fn);
            results.push({ name: test.name, passed });
        }

        // Final cleanup after tests
        await cleanupCollections();
    }

    // Summary
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    log(`Test Summary: ${passedTests}/${totalTests} tests passed`);

    if (passedTests !== totalTests) {
        const failedTests = results.filter(r => !r.passed).map(r => r.name);
        log(`Failed tests: ${failedTests.join(', ')}`, 'error');
        throw new Error('Not all tests passed');
    }

    return true;
}
