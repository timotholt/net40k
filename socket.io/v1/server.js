const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:5173", // Vite dev server
        methods: ["GET", "POST"]
    }
});
const path = require('path');
const readline = require('readline');

// Create interface for reading from console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store connected clients and objects
const connectedClients = new Set();
const sentObjects = [];
const receivedObjects = [];

io.on('connection', (socket) => {
    console.log('[SERVER] Client connected:', socket.id);
    connectedClients.add(socket.id);

    // Send existing objects to newly connected client
    socket.emit('initial-objects', { sent: sentObjects, received: receivedObjects });

    // Handle new object from client
    socket.on('new-object', (obj) => {
        console.log('[SERVER] Received from client:', obj);
        receivedObjects.push(obj);
        // Broadcast to all clients except sender
        socket.broadcast.emit('object-received', obj);
    });

    socket.on('disconnect', () => {
        console.log('[SERVER] Client disconnected:', socket.id);
        connectedClients.delete(socket.id);
    });
});

function showMenu() {
    console.log('\n[SERVER] --- Menu ---');
    console.log('[SERVER] a) Send object to all clients');
    console.log('[SERVER] b) Display sent objects');
    console.log('[SERVER] c) Display received objects');
    console.log('[SERVER] d) Show connected clients');
    console.log('[SERVER] e) Quit');
    console.log('[SERVER] Choose an option: ');
}

function handleUserInput() {
    rl.question('', (choice) => {
        switch(choice.toLowerCase()) {
            case 'a':
                rl.question('[SERVER] Enter object name: ', (name) => {
                    rl.question('[SERVER] Enter object value: ', (value) => {
                        const obj = { 
                            name, 
                            value, 
                            timestamp: new Date().toISOString(),
                            source: 'server'
                        };
                        sentObjects.push(obj);
                        io.emit('object-received', obj);
                        console.log('[SERVER] Object sent:', obj);
                        showMenu();
                        handleUserInput();
                    });
                });
                break;
            
            case 'b':
                console.log('\n[SERVER] Sent objects:');
                sentObjects.forEach((obj, index) => {
                    console.log(`[SERVER] ${index + 1}:`, obj);
                });
                showMenu();
                handleUserInput();
                break;

            case 'c':
                console.log('\n[SERVER] Received objects:');
                receivedObjects.forEach((obj, index) => {
                    console.log(`[SERVER] ${index + 1}:`, obj);
                });
                showMenu();
                handleUserInput();
                break;

            case 'd':
                console.log('\n[SERVER] Connected clients:');
                connectedClients.forEach(clientId => {
                    console.log('[SERVER] -', clientId);
                });
                showMenu();
                handleUserInput();
                break;
            
            case 'e':
                console.log('[SERVER] Shutting down server...');
                process.exit(0);
                break;
            
            default:
                console.log('[SERVER] Invalid option. Please try again.');
                showMenu();
                handleUserInput();
        }
    });
}

const PORT = 3002;
http.listen(PORT, () => {
    console.log(`[SERVER] Listening for connections on port ${PORT}`);
    console.log(`[SERVER] Running at http://localhost:${PORT}`);
    showMenu();
    handleUserInput();
});
