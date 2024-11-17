import readline from 'readline';
import { testDatabaseEngine, clearDatabase, testRaceConditions } from './databaseTest.js';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startInteractiveTestMode() {
    console.log('\n🧪 Net40k Test Runner');
    console.log('Commands:');
    console.log('  t - Run tests');
    console.log('  r - Run race condition tests');
    console.log('  s - Start server');
    console.log('  c - Clear database');
    console.log('  q - Quit');
    console.log('\nEnter command:');

    rl.on('line', async (answer) => {
        try {
            switch(answer.toLowerCase()) {
                case 't':
                    console.log('\nRunning tests...');
                    try {
                        await testDatabaseEngine();
                        console.log('✅ All tests passed!');
                    } catch (error) {
                        console.error('❌ Test failed:', error);
                    }
                    break;
                case 'r':
                    console.log('\nRunning race condition tests...');
                    try {
                        await testRaceConditions();
                        console.log('✅ Race condition tests passed!');
                    } catch (error) {
                        console.error('❌ Race condition test failed:', error);
                    }
                    break;
                case 'c':
                    console.log('\nClearing database...');
                    try {
                        await clearDatabase();
                        console.log('✅ Database cleared successfully');
                    } catch (error) {
                        console.error('❌ Failed to clear database:', error);
                    }
                    break;
                case 's':
                    console.log('⚠️ Please start the server using: node server.js s');
                    break;
                case 'q':
                    console.log('👋 Goodbye!');
                    rl.close();
                    process.exit(0);
                default:
                    console.log('❌ Unknown command');
            }
            console.log('\nEnter command:');
        } catch (error) {
            console.error('Error processing command:', error);
            console.log('\nEnter command:');
        }
    });
}

export async function handleTestCommand(command) {
    try {
        switch (command) {
            case 't':
            case 'test':
                await testDatabaseEngine();
                break;
            case 'r':
            case 'race':
                console.log('Running race condition tests...');
                await testRaceConditions();
                break;
            case 'c':
            case 'clear':
                console.log('Clearing database...');
                await clearDatabase();
                console.log('Database cleared successfully');
                break;
            case undefined:
            case 'i':
            case 'interactive':
                await startInteractiveTestMode();
                break;
            default:
                throw new Error(`Unknown test command: ${command}`);
        }
    } catch (error) {
        console.error('Error in test command:', error);
        throw error;
    }
}
