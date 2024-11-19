// Main entry point with top-level await
async function main() {
    try {
        // Import and run test mode if needed
        if (process.argv[2] === 'test') {
            const { startInteractiveTestMode } = await import('./tests/testRunner.js');
            // Test runner handles its own exit
            await startInteractiveTestMode();
        }

        // Only import server dependencies if not in test mode
        const express = (await import('express')).default;
        const { WebSocketServer } = await import('ws');
        const { router: userRoutes } = await import('./routes/Users.js');
        const { router: lobbyRoutes } = await import('./routes/lobby.js');
        const { router: adminRoutes } = await import('./routes/admin.js');
        const { router: chatRoutes } = await import('./routes/chat.js');
        const { router: cacheRoutes } = await import('./routes/cache.js');
        const { db } = await import('./database/database.js');
        const { requestLogger } = await import('./middleware/requestLogger.js');
        const { notFoundHandler, errorHandler } = await import('./middleware/errorHandling.js');
        const { SystemMessages } = await import('./models/SystemMessages.js');
        const { default: UserWebSocketHandler } = await import('./services/UserWebSocketHandler.js');
        const { DatabaseSessionStore } = await import('./services/SessionStore.js');
        const { userService } = await import('./services/UserService.js');
        const { chatCommandService } = await import('./services/ChatCommandService.js');
        const { default: SessionManager } = await import('./services/SessionManager.js');
        const { config } = await import('dotenv');
        const path = await import('path');
        const { fileURLToPath } = await import('url');
        const { buildInfo } = await import('./buildInfo.js');

        // Initialize environment
        config();
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Create express app
        const app = express();
        const port = process.env.PORT || 3000;

        console.log('Initializing services...');
        
        // Initialize database first
        console.log('Initializing database...');
        await db.init();
        console.log('✓ Database initialized');
        
        // Initialize UserService
        await userService.initialize();
        console.log('✓ UserService initialized');

        // Request processing middleware
        app.use(express.json({ limit: '10kb' }));
        app.use(express.urlencoded({ extended: true }));

        // CORS middleware configuration
        app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            
            if (req.method === 'OPTIONS') {
                return res.status(200).end();
            }
            next();
        });

        // Custom middleware
        app.use(requestLogger);

        // Debug middleware
        app.use((req, res, next) => {
            console.log('Debug - Incoming request:', {
                method: req.method,
                path: req.path,
                baseUrl: req.baseUrl,
                originalUrl: req.originalUrl
            });
            next();
        });

        // API Routes
        console.log('Mounting user routes at /user');
        app.use('/user', userRoutes);
        //app.use('/lobby', lobbyRoutes);
        //app.use('/admin', adminRoutes);
        //app.use('/chat', chatRoutes);
        //app.use('/cache', cacheRoutes);

        // Root route
        app.get('/about', (req, res) => {
            res.json({ message: 'Hello World!' });
        });

        // Static files - after API routes
        app.use(express.static(path.join(__dirname, '../frontend/build')));

        // Catch-all route to serve React's index.html
        app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
        });

        // Error handling
        app.use(notFoundHandler);
        app.use(errorHandler);

        // Start HTTP server
        const server = app.listen(port, () => {
            console.log('Build Info:', buildInfo);
            console.log(`🚀 Server is running on port ${port}`);
        });

        // Setup WebSocket server
        const wss = new WebSocketServer({ server });
        wss.on('connection', UserWebSocketHandler.handleConnection);
        UserWebSocketHandler.startHeartbeat(wss);

    } catch (error) {
        console.error('Error in main:', error);
        process.exit(1);
    }
}

main();