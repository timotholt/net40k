import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { router as userRoutes } from './routes/users.js';
import { router as lobbyRoutes } from './routes/lobby.js';
import { router as adminRoutes } from './routes/admin.js';
import { router as chatRoutes } from './routes/chat.js';
import { router as cacheRoutes } from './routes/cache.js';
import { db } from './database/database.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandling.js';
import { SystemMessages } from './models/SystemMessages.js';
import UserWebSocketHandler from './services/UserWebSocketHandler.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildInfo } from './buildInfo.js';
import { handleTestCommand } from './tests/testRunner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Get command line argument
const command = process.argv[2];

async function startServer() {
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

    // Session middleware
    app.use(session({
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ 
            mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/net40k',
            ttl: 24 * 60 * 60 // 24 hours
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 // 24 hours
        }
    }));

    // Rate limiting
    const userLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again after 15 minutes'
    });

    // Custom middleware
    app.use(requestLogger);

    // Static files
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Catch-all route to serve React's index.html for client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
    });

    // Routes with rate limiting
    app.use('/user', userLimiter, userRoutes);
    app.use('/lobby', lobbyRoutes);
    app.use('/admin', adminRoutes);
    app.use('/chat', chatRoutes);
    app.use('/cache', cacheRoutes);

    // Root route
    app.get('/about', (req, res) => {
        res.json({ message: 'Hello World!' });
    });

    // Error handling
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Start HTTP server
    const server = app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
        console.log('Build Info:', buildInfo);
    });

    // Setup WebSocket server
    const wss = new WebSocketServer({ server });
    wss.on('connection', UserWebSocketHandler.handleConnection);
    UserWebSocketHandler.startHeartbeat(wss);
}

async function main() {
    try {
        // Comment out this if-else block to disable test functionality
        if (command === 's' || command === 'start') {
            await startServer();
        } else {
            await handleTestCommand(command);
        }
    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

main();