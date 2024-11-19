import readline from 'readline';
import { testDatabaseEngine, clearDatabase } from './databaseTest.js';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function displayMenu() {
    console.log('\n🧪 Net40k Test Runner');
    console.log('Commands:');
    console.log('  t - Run tests');
    console.log('  s - Start server');
    console.log('  c - Clear database');
    console.log('  q - Quit');
    console.log('\nEnter command:');
}

export async function startInteractiveTestMode() {
    displayMenu();

    // Return a Promise that resolves when we want to start the server
    return new Promise((resolve) => {
        let startingServer = false;

        rl.on('line', async (answer) => {
            const command = answer.trim().toLowerCase();
            try {
                switch (command) {
                    case 't':
                        await testDatabaseEngine();
                        displayMenu(); // Show menu after test completes
                        break;
                    case 'c':
                        await clearDatabase();
                        console.log('✅ Database cleared successfully');
                        displayMenu(); // Show menu after clear completes
                        break;
                    case 's':
                        console.log('Starting server...');
                        startingServer = true;
                        rl.close();
                        resolve(); // Resolve the promise to continue with server startup
                        break;
                    case 'q':
                        rl.close();
                        process.exit(0);
                    default:
                        console.log('Unknown command');
                        displayMenu(); // Show menu after invalid command
                }
            } catch (error) {
                console.error('Command failed:', error);
                displayMenu(); // Show menu after error
            }
        });

        rl.on('close', () => {
            if (!startingServer) {
                process.exit(0);
            }
        });
    });
}
