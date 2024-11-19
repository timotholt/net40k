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
        'test_integrity',
        'test_indexes'
    ];

    try {
        // First try to delete each collection individually
        for (const collection of collections) {
            try {
                await db.deleteCollection(collection);
            } catch (error) {
                if (error.code !== 26) { // Ignore "collection doesn't exist" errors
                    console.error(`Error cleaning up ${collection}:`, error);
                }
            }
        }

        // Double check that everything is gone
        for (const collection of collections) {
            const remainingDocs = await db.find(collection, {});
            if (remainingDocs && remainingDocs.length > 0) {
                console.warn(`Collection ${collection} not fully deleted, clearing...`);
                await db.clear(collection);
            }
        }
    } catch (error) {
        console.error('Error in cleanup:', error);
        throw error;
    }
}

// Database clear function for external use
export async function clearDatabase() {
    try {
        await db.init();
        await cleanupCollections();
        await db.disconnect();
        return true;
    } catch (error) {
        console.error('Failed to clear database:', error);
        throw error;
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
        uuid: 'test-crud-1',
        name: 'Test Item',
        created: new Date(),
        tags: ['test', 'crud'],
        nested: { field: 'value' }
    };

    // Create
    const created = await db.create('test_collection', testData);
    console.log('Created data:', created);
    console.log('Created date type:', created.created instanceof Date);
    assert(created.uuid === testData.uuid, 'Created item should have the same UUID');

    // Read
    const found = await db.findOne('test_collection', { uuid: testData.uuid });
    console.log('\nDate Comparison:');
    console.log('Original date:', {
        value: testData.created,
        type: testData.created.constructor.name,
        isDate: testData.created instanceof Date,
        timestamp: testData.created.getTime(),
        iso: testData.created.toISOString(),
        toString: testData.created.toString()
    });
    console.log('Found date:', {
        value: found.created,
        type: found.created.constructor.name,
        isDate: found.created instanceof Date,
        timestamp: found.created?.getTime?.(),
        iso: found.created?.toISOString?.(),
        toString: found.created?.toString?.()
    });
    console.log('Raw found object:', found);

    assert(found.name === testData.name, 'Found item should match created item');
    assert(found.created instanceof Date, 'Date should be properly deserialized');
    assert(Array.isArray(found.tags), 'Arrays should be preserved');
    assert(found.nested.field === 'value', 'Nested objects should be preserved');

    // Update
    const updateData = { name: 'Updated Item' };
    await db.update('test_collection', { uuid: testData.uuid }, updateData);
    const updated = await db.findOne('test_collection', { uuid: testData.uuid });
    assert(updated.name === 'Updated Item', 'Item should be updated');

    // Delete
    await db.delete('test_collection', { uuid: testData.uuid });
    const deleted = await db.findOne('test_collection', { uuid: testData.uuid });
    assert(!deleted, 'Item should be deleted');
}

// Date handling test
async function testDateHandling() {
    const dates = {
        uuid: 'test-dates',
        current: new Date(),
        past: new Date('2020-01-01'),
        future: new Date('2025-12-31'),
        timestamp: Date.now()
    };

    await db.create('test_dates', dates);
    const retrieved = await db.findOne('test_dates', { uuid: 'test-dates' });

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
        uuid: 'test-arrays',
        emptyArray: [],
        numberArray: [1, 2, 3],
        objectArray: [{ id: 1 }, { id: 2 }],
        nestedArrays: [[1, 2], [3, 4]]
    };

    console.log('Original array data:', JSON.stringify(arrayData, null, 2));
    await db.create('test_arrays', arrayData);
    const retrieved = await db.findOne('test_arrays', { uuid: 'test-arrays' });
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
        { uuid: 'query-1', value: 10, category: 'A' },
        { uuid: 'query-2', value: 20, category: 'A' },
        { uuid: 'query-3', value: 30, category: 'B' }
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
        uuid: 'concurrent-test',
        counter: 0
    };
    
    // Create initial document
    await db.create('test_concurrent', testDoc);
    
    // Perform concurrent increments
    const operations = [];
    for (let i = 0; i < numOperations; i++) {
        operations.push((async () => {
            const doc = await db.findOne('test_concurrent', { uuid: 'concurrent-test' });
            doc.counter++;
            await db.update('test_concurrent', { uuid: 'concurrent-test' }, doc);
        })());
    }
    
    // Wait for all operations to complete
    await Promise.all(operations);
    
    // Verify final count
    const finalDoc = await db.findOne('test_concurrent', { uuid: 'concurrent-test' });
    assert(finalDoc.counter === numOperations, `Expected counter to be ${numOperations}, got ${finalDoc.counter}`);
}

// Performance and load testing
async function testPerformance() {
    // Test with minimal documents to avoid hitting Firestore quotas
    const testDoc = {
        uuid: 'perf-test-1',
        value: 'test-1',
        number: 1,
        nested: {
            field1: 'nested-1',
            field2: 2
        }
    };
    
    // Test single write and read
    await db.create('test_performance', testDoc);
    const savedDoc = await db.findOne('test_performance', { uuid: 'perf-test-1' });
    assert(savedDoc.nested.field2 === 2, 'Should correctly store and retrieve nested data');

    // Test simple query with sort
    const sortedDoc = await db.find('test_performance', {}, { sort: { number: -1 }, limit: 1 });
    assert(sortedDoc.length === 1, 'Should return single document');
    assert(sortedDoc[0].uuid === 'perf-test-1', 'Should return correct document');
}

// Error recovery testing
async function testErrorRecovery() {
    // Test partial updates
    const doc = {
        uuid: 'error-test',
        field1: 'value1',
        field2: 'value2'
    };
    
    await db.create('test_errors', doc);
    
    // Test partial update with undefined field
    const updateDoc = {
        field1: 'new-value1'
        // field2 is intentionally omitted to test partial update
    };
    await db.update('test_errors', { uuid: 'error-test' }, updateDoc);
    
    // Verify document maintains untouched fields
    const checkDoc = await db.findOne('test_errors', { uuid: 'error-test' });
    assert(checkDoc.field2 === 'value2', 'Document should maintain untouched fields');
    assert(checkDoc.field1 === 'new-value1', 'Document should update specified fields');
}

// Index management test
async function testIndexManagement() {
    const collection = 'test_indexes';
    
    // Create collection first
    await db.createCollection(collection);
    
    // Test single index creation
    await db.createIndex(collection, { field1: 1 }, { unique: true });
    let indexes = await db.listIndexes(collection);
    assert(indexes.length >= 2, 'Should have at least 2 indexes (default _id and field1)');
    assert(indexes.some(idx => idx.fields.field1 === 1), 'Should have field1 index');
    
    // Test compound index creation
    await db.createIndex(collection, { field2: -1, field3: 1 });
    indexes = await db.listIndexes(collection);
    assert(indexes.some(idx => idx.fields.field2 === -1 && idx.fields.field3 === 1), 
        'Should have compound index on field2 and field3');
    
    // Test sparse index creation
    await db.createIndex(collection, { field4: 1 }, { sparse: true });
    indexes = await db.listIndexes(collection);
    assert(indexes.some(idx => idx.fields.field4 === 1 && idx.sparse), 
        'Should have sparse index on field4');
    
    // Verify all indexes
    indexes = await db.listIndexes(collection);
    console.log('Final indexes:', JSON.stringify(indexes, null, 2));
    
    // Verify we can still perform operations with indexes
    const testDoc = {
        field1: 'unique1',
        field2: 100,
        field3: 'test',
        field4: 'sparse'
    };
    await db.create(collection, testDoc);
    
    // Test unique constraint
    try {
        const dupDoc = { ...testDoc };
        await db.create(collection, dupDoc);
        assert(false, 'Should not allow duplicate field1 value');
    } catch (error) {
        assert(error.message.includes('duplicate') || error.message.includes('unique'), 
            'Should fail with uniqueness violation');
    }
}

// Data integrity testing
async function testDataIntegrity() {
    // Test 1: Partial Updates
    const doc1 = {
        uuid: 'integrity-test-1',
        field1: 'value1',
        field2: 'value2',
        nested: {
            a: 1,
            b: 2
        },
        array: [1, 2, 3]
    };
    
    await db.create('test_integrity', doc1);
    
    // Test 1.0: Verify no _id in returned document
    let created = await db.findOne('test_integrity', { uuid: 'integrity-test-1' });
    assert(!('_id' in created), 'Document should not contain _id field');
    assert.deepStrictEqual(Object.keys(created).sort(), ['array', 'field1', 'field2', 'nested', 'uuid'].sort(), 'Document should only contain expected fields');
    
    // Test 1.1: Update single field
    await db.update('test_integrity', { uuid: 'integrity-test-1' }, { field1: 'updated1' });
    let updated = await db.findOne('test_integrity', { uuid: 'integrity-test-1' });
    assert(updated.field1 === 'updated1', 'Single field should be updated');
    assert(updated.field2 === 'value2', 'Untouched field should remain unchanged');
    assert(updated.nested.a === 1, 'Nested objects should be preserved');
    assert(updated.array.length === 3, 'Arrays should be preserved');
    
    // Test 1.2: Update nested field
    await db.update('test_integrity', { uuid: 'integrity-test-1' }, { 'nested.a': 10 });
    updated = await db.findOne('test_integrity', { uuid: 'integrity-test-1' });
    assert(updated.nested.a === 10, 'Nested field should be updated');
    assert(updated.nested.b === 2, 'Other nested fields should be preserved');
    
    // Test 1.3: Update array
    await db.update('test_integrity', { uuid: 'integrity-test-1' }, { array: [4, 5, 6] });
    updated = await db.findOne('test_integrity', { uuid: 'integrity-test-1' });
    assert(updated.array.length === 3, 'Array length should match');
    assert(updated.array[0] === 4, 'Array should be updated');
    assert(updated.field1 === 'updated1', 'Previous updates should be preserved');
    
    // Test 2: Document Updates with Field Removal
    const doc2 = {
        uuid: 'integrity-test-2',
        original: true,
        count: 1
    };
    
    await db.create('test_integrity', doc2);
    
    // Test 2.1: Update with new fields and field removal
    const updateData = {
        uuid: 'integrity-test-2',
        new: true,
        data: { x: 1 },
        original: null  // Explicitly set to null to remove
    };
    
    await db.update('test_integrity', { uuid: 'integrity-test-2' }, updateData);
    updated = await db.findOne('test_integrity', { uuid: 'integrity-test-2' });
    assert(updated.new === true, 'New fields should be added');
    assert(updated.data.x === 1, 'New nested objects should be added');
    assert(updated.original === null, 'Fields can be explicitly nulled');
    
    // Test 3: Multiple Updates
    const doc3 = {
        uuid: 'integrity-test-3',
        counter: 0,
        history: []
    };
    
    await db.create('test_integrity', doc3);
    
    // Test 3.1: Sequential updates
    for (let i = 1; i <= 5; i++) {
        await db.update('test_integrity', { uuid: 'integrity-test-3' }, {
            counter: i,
            history: Array(i).fill(true)
        });
        
        updated = await db.findOne('test_integrity', { uuid: 'integrity-test-3' });
        assert(updated.counter === i, `Counter should be ${i}`);
        assert(updated.history.length === i, `History length should be ${i}`);
    }
}

// Main test runner
export async function testDatabaseEngine() {
    try {
        log('Starting database tests...');
        let allTestsPassed = true;

        // Ensure clean state by disconnecting first
        if (db.isConnected()) {
            log('Cleaning up previous connection...');
            await db.disconnect();
        }
        
        const tests = [
            ['Database Initialization', testDatabaseInitialization],
            ['Basic CRUD Operations', testBasicCRUD],
            ['Date Handling', testDateHandling],
            ['Array Handling', testArrayHandling],
            ['Query Operations', testQueryOperations],
            ['Index Management', testIndexManagement],
            ['Data Integrity', testDataIntegrity],
            ['Performance', testPerformance],
            ['Error Recovery', testErrorRecovery]
        ];

        // Run all tests in sequence, maintaining connection between CRUD tests
        for (let i = 0; i < tests.length; i++) {
            const [name, testFn] = tests[i];
            
            // For non-initialization tests, ensure we're connected
            if (i > 0 && !db.isConnected()) {
                await db.init();
            }
            
            const passed = await runTest(name, testFn);
            if (!passed) allTestsPassed = false;
            
            // Cleanup after each test except initialization
            if (i > 0) {
                await cleanupCollections();
            }
        }

        // Ensure we disconnect at the end
        if (db.isConnected()) {
            await db.disconnect();
        }
        
        if (allTestsPassed) {
            log('All tests completed successfully! 🎉');
            return true;
        } else {
            log('Some tests failed.', 'error');
            return false;
        }
    } catch (error) {
        log('Test execution failed: ' + error.message, 'error');
        console.error(error);
        return false;
    } finally {
        // Extra safety: ensure we're disconnected even if tests fail
        if (db.isConnected()) {
            await db.disconnect();
        }
    }
}
