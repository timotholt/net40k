import readline from 'readline';
import { testDatabaseEngine, clearDatabase } from './databaseTest.js';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function startInteractiveTestMode() {
    return new Promise((resolve) => {
        console.log('\n🧪 Net40k Test Runner');
        console.log('Commands:');
        console.log('  t - Run tests');
        console.log('  s - Start server');
        console.log('  c - Clear database');
        console.log('  q - Quit');
        console.log('\nEnter command:');

        rl.on('line', async (answer) => {
            const restart = await handleTestCommand(answer.trim().toLowerCase());
            if (restart) {
                process.exit(0); // Exit to let nodemon restart
            }
            if (answer.toLowerCase() !== 'q') {
                console.log('\nEnter command:');
            }
        });

        rl.on('close', () => {
            resolve();
        });
    });
}

export async function handleTestCommand(command) {
    try {
        switch (command) {
            case 't':
                await testDatabaseEngine();
                return false;
            case 'c':
                await clearDatabase();
                console.log('✅ Database cleared successfully');
                return false;
            case 's':
                console.log('Starting server...');
                return true;
            case 'q':
                if (rl) rl.close();
                process.exit(0);
            default:
                console.log('Unknown command');
                return false;
        }
    } catch (error) {
        console.error('Command failed:', error);
        return false;
    }
}

// Start the test runner
startInteractiveTestMode().catch(console.error);
