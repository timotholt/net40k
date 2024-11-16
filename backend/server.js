import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { router as userRoutes } from './routes/users.js';
import { router as lobbyRoutes } from './routes/lobby.js';
import { router as adminRoutes } from './routes/admin.js';
import { router as chatRoutes } from './routes/chat.js';
import { router as cacheRoutes } from './routes/cache.js';
import { db } from './database/database.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandling.js';
import { SystemMessages } from './models/SystemMessages.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { buildInfo } from './buildInfo.js';
import { testAllDatabaseFunctions } from './tests/databaseTest.js';
import { ChatDB } from './models/Chat.js';
import { UserDB } from './models/User.js';
import { GameStateDB } from './models/GameState.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Interactive startup mode
async function interactiveStartup() {
    console.log('\n🚀 Net40k Server Interactive Mode');
    console.log('Commands:');
    console.log('  t - Run tests');
    console.log('  s - Start server');
    console.log('  q - Quit');
    console.log('\nEnter command:');

    rl.on('line', async (answer) => {
        switch(answer.toLowerCase()) {
            case 't':
                console.log('\nRunning tests...');
                try {
                    await testAllDatabaseFunctions();
                    console.log('✅ All tests passed!');
                } catch (error) {
                    console.error('❌ Test failed:', error);
                }
                break;
            case 's':
                await startServer();
                break;
            case 'q':
                console.log('👋 Goodbye!');
                process.exit(0);
            default:
                console.log('❌ Unknown command');
        }
        console.log('\nEnter command:');
    });
}

// Add this near the top of server.js, after creating the app
app.set('trust proxy', true);

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Request processing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(mongoSanitize());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});

// Custom middleware
app.use(requestLogger);

// Static files
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Catch-all route to serve React's index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Routes
app.use('/user', userRoutes);
app.use('/lobby', lobbyRoutes);
app.use('/chat', chatRoutes);
app.use('/admin', adminRoutes);
app.use('/cache', cacheRoutes);

// Root route
app.get('/about', (req, res) => {
    res.json({ message: 'Hello World!' });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server with interactive mode
async function startServer() {
    rl.close();
    
    try {
        console.log('Initializing server...');

        // Connect to the database
        if (!db.isConnected()) {
            await db.connect();
        }

        console.log('Server initialization complete.');
    } catch (error) {
        console.error('Server initialization failed:', error);
        process.exit(1);
    }
    
    app.listen(port, () => {
        console.log(`\n🚀 Server running at http://localhost:${port}`);
        console.log(`📦 Version: ${buildInfo.version} (Built: ${buildInfo.buildDate})`);
    });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    rl.close();
    await SystemMessages.serverShutdown(5);
    setTimeout(() => process.exit(0), 5000);
});

// Start the server
interactiveStartup();