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

// Cleanup utility
async function cleanupCollections() {
    const collections = [
        'test_collection',
        'test_dates',
        'test_arrays',
        'test_queries',
        'user',
        'gamestate',
        'chat',
        'test_concurrent',
        'test_cache',
        'test_performance',
        'test_errors',
        'test_parents',
        'test_children',
        'test_integrity'
    ];

    for (const collection of collections) {
        try {
            await db.deleteCollection(collection);
            const remainingDocs = await db.find(collection, {});
            if (remainingDocs && remainingDocs.length > 0) {
                throw new Error(`Collection ${collection} not fully deleted`);
            }
        } catch (error) {
            console.error(`Error cleaning up ${collection}:`, error);
        }
    }
}

// Database clear function for external use
export async function clearDatabase() {
    try {
        await db.init();
        await cleanupCollections();
        return true;
    } catch (error) {
        console.error('Failed to clear database:', error);
        throw error;
    } finally {
        try {
            await db.disconnect();
        } catch (error) {
            console.error('Error disconnecting:', error);
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

// Concurrency tests
async function testConcurrentOperations() {
    const numOperations = 50;
    const testDoc = {
        _id: 'concurrent-test',
        counter: 0
    };
    
    // Create initial document
    await db.create('test_concurrent', testDoc);
    
    // Perform concurrent increments
    const operations = [];
    for (let i = 0; i < numOperations; i++) {
        operations.push((async () => {
            const doc = await db.findOne('test_concurrent', { _id: 'concurrent-test' });
            doc.counter++;
            await db.update('test_concurrent', { _id: 'concurrent-test' }, doc);
        })());
    }
    
    // Wait for all operations to complete
    await Promise.all(operations);
    
    // Verify final count
    const finalDoc = await db.findOne('test_concurrent', { _id: 'concurrent-test' });
    assert(finalDoc.counter === numOperations, `Expected counter to be ${numOperations}, got ${finalDoc.counter}`);
}

// Cache consistency test
async function testCacheConsistency() {
    const testData = {
        _id: 'cache-test-1',
        value: 'original'
    };

    // Create initial document
    await db.create('test_cache', testData);

    // First read should populate cache
    const firstRead = await db.findOne('test_cache', { _id: testData._id });
    assert(firstRead.value === 'original', 'Initial read should return original value');

    // Update document
    await db.update('test_cache', { _id: testData._id }, { value: 'updated' });

    // Second read should reflect update
    const secondRead = await db.findOne('test_cache', { _id: testData._id });
    assert(secondRead.value === 'updated', 'Cache should be invalidated after update');

    // Test document replacement
    const replacementData = {
        _id: testData._id,
        value: 'replaced',
        newField: 'new'
    };
    await db.update('test_cache', { _id: testData._id }, replacementData);

    // Third read should show complete replacement
    const thirdRead = await db.findOne('test_cache', { _id: testData._id });
    assert(thirdRead.value === 'replaced', 'Cache should reflect document replacement');
    assert(thirdRead.newField === 'new', 'New fields should be added');
    assert(Object.keys(thirdRead).length === 3, 'Document should only have _id, value, and newField');

    // Test partial update
    await db.update('test_cache', { _id: testData._id }, { value: 'partial' });

    // Fourth read should show partial update
    const fourthRead = await db.findOne('test_cache', { _id: testData._id });
    assert(fourthRead.value === 'partial', 'Cache should reflect partial update');
    assert(fourthRead.newField === 'new', 'Unmodified fields should remain');

    // Delete document
    await db.delete('test_cache', { _id: testData._id });

    // Fifth read should return null
    const fifthRead = await db.findOne('test_cache', { _id: testData._id });
    assert(!fifthRead, 'Cache should be invalidated after delete');
}

// Performance and load testing
async function testPerformance() {
    // Test with minimal documents to avoid hitting Firestore quotas
    const testDoc = {
        _id: 'perf-test-1',
        value: 'test-1',
        number: 1,
        nested: {
            field1: 'nested-1',
            field2: 2
        }
    };
    
    // Test single write and read
    await db.create('test_performance', testDoc);
    const savedDoc = await db.findOne('test_performance', { _id: 'perf-test-1' });
    assert(savedDoc.nested.field2 === 2, 'Should correctly store and retrieve nested data');

    // Test simple query with sort
    const sortedDoc = await db.find('test_performance', {}, { sort: { number: -1 }, limit: 1 });
    assert(sortedDoc.length === 1, 'Should return single document');
    assert(sortedDoc[0]._id === 'perf-test-1', 'Should return correct document');
}

// Error recovery testing
async function testErrorRecovery() {
    // Test partial updates
    const doc = {
        _id: 'error-test',
        field1: 'value1',
        field2: 'value2'
    };
    
    await db.create('test_errors', doc);
    
    // Test partial update with undefined field
    const updateDoc = {
        field1: 'new-value1'
        // field2 is intentionally omitted to test partial update
    };
    await db.update('test_errors', { _id: 'error-test' }, updateDoc);
    
    // Verify document maintains untouched fields
    const checkDoc = await db.findOne('test_errors', { _id: 'error-test' });
    assert(checkDoc.field2 === 'value2', 'Document should maintain untouched fields');
    assert(checkDoc.field1 === 'new-value1', 'Document should update specified fields');
}

// Data integrity testing
async function testDataIntegrity() {
    // Test 1: Partial Updates
    const doc1 = {
        _id: 'integrity-test-1',
        field1: 'value1',
        field2: 'value2',
        nested: {
            a: 1,
            b: 2
        },
        array: [1, 2, 3]
    };
    
    await db.create('test_integrity', doc1);
    
    // Test 1.1: Update single field
    await db.update('test_integrity', { _id: 'integrity-test-1' }, { field1: 'updated1' });
    let updated = await db.findOne('test_integrity', { _id: 'integrity-test-1' });
    assert(updated.field1 === 'updated1', 'Single field should be updated');
    assert(updated.field2 === 'value2', 'Untouched field should remain unchanged');
    assert(updated.nested.a === 1, 'Nested objects should be preserved');
    assert(updated.array.length === 3, 'Arrays should be preserved');
    
    // Test 1.2: Update nested field
    await db.update('test_integrity', { _id: 'integrity-test-1' }, { 'nested.a': 10 });
    updated = await db.findOne('test_integrity', { _id: 'integrity-test-1' });
    assert(updated.nested.a === 10, 'Nested field should be updated');
    assert(updated.nested.b === 2, 'Other nested fields should be preserved');
    
    // Test 1.3: Update array
    await db.update('test_integrity', { _id: 'integrity-test-1' }, { array: [4, 5, 6] });
    updated = await db.findOne('test_integrity', { _id: 'integrity-test-1' });
    assert(updated.array.length === 3, 'Array length should match');
    assert(updated.array[0] === 4, 'Array should be updated');
    assert(updated.field1 === 'updated1', 'Previous updates should be preserved');
    
    // Test 2: Document Replacement
    const doc2 = {
        _id: 'integrity-test-2',
        original: true,
        count: 1
    };
    
    await db.create('test_integrity', doc2);
    
    // Test 2.1: Replace with new fields
    const replacement = {
        _id: 'integrity-test-2',
        new: true,
        data: { x: 1 }
    };
    
    await db.update('test_integrity', { _id: 'integrity-test-2' }, replacement);
    updated = await db.findOne('test_integrity', { _id: 'integrity-test-2' });
    assert(updated.new === true, 'New fields should be added');
    assert(updated.data.x === 1, 'New nested objects should be added');
    assert(updated.original === undefined, 'Old fields should be removed');
    
    // Test 3: Multiple Updates
    const doc3 = {
        _id: 'integrity-test-3',
        counter: 0,
        history: []
    };
    
    await db.create('test_integrity', doc3);
    
    // Test 3.1: Sequential updates
    for (let i = 1; i <= 5; i++) {
        await db.update('test_integrity', { _id: 'integrity-test-3' }, {
            counter: i,
            history: Array(i).fill(true)
        });
        
        updated = await db.findOne('test_integrity', { _id: 'integrity-test-3' });
        assert(updated.counter === i, `Counter should be ${i}`);
        assert(updated.history.length === i, `History length should be ${i}`);
    }
}

// Race condition test (separated from main test suite)
export async function testRaceConditions() {
    await db.init();
    console.log('Starting race condition tests...');
    
    try {
        await testConcurrentOperations();
        console.log('✅ Race condition tests passed!');
    } catch (error) {
        console.error('❌ Race condition test failed:', error);
        throw error;
    }
}

// Main test runner
export async function testDatabaseEngine() {
    try {
        log('Starting database tests...');
        
        // First run: Cache disabled
        process.env.ENABLE_CACHE = 'false';
        log('Running tests with cache DISABLED');
        let allTestsPassed = true;
        
        const tests = [
            ['Database Initialization', testDatabaseInitialization],
            ['Basic CRUD Operations', testBasicCRUD],
            ['Date Handling', testDateHandling],
            ['Array Handling', testArrayHandling],
            ['Query Operations', testQueryOperations],
            ['Data Integrity', testDataIntegrity],
            ['Cache Consistency', testCacheConsistency],
            ['Performance', testPerformance],
            ['Error Recovery', testErrorRecovery]
        ];

        // Run initialization test first
        const [initName, initTest] = tests[0];
        const initPassed = await runTest(initName, initTest);
        if (!initPassed) allTestsPassed = false;

        // Run remaining tests after database is initialized
        await db.init();
        for (let i = 1; i < tests.length; i++) {
            const [name, testFn] = tests[i];
            const passed = await runTest(name, testFn);
            if (!passed) allTestsPassed = false;
            await cleanupCollections();
        }
        await db.disconnect();
        
        // Second run: Cache enabled
        process.env.ENABLE_CACHE = 'true';
        log('\nRunning tests with cache ENABLED');
        
        // Run initialization test first again
        const initPassedCached = await runTest(initName, initTest);
        if (!initPassedCached) allTestsPassed = false;

        // Run remaining tests after database is initialized
        await db.init();
        for (let i = 1; i < tests.length; i++) {
            const [name, testFn] = tests[i];
            const passed = await runTest(name, testFn);
            if (!passed) allTestsPassed = false;
            await cleanupCollections();
        }
        await db.disconnect();
        
        if (allTestsPassed) {
            log('All tests completed successfully! 🎉');
            process.exit(0);
        } else {
            log('Some tests failed. Check the logs above for details.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    }
}
