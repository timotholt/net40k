const io = require('socket.io-client');
const readline = require('readline');

const SERVER_PORT = 3002;
const socket = io(`http://localhost:${SERVER_PORT}`);
const objects = [];

// Create interface for reading from console
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Handle receiving initial objects
socket.on('initial-objects', (initialObjects) => {
    objects.push(...initialObjects);
    console.log('[CLIENT] Received initial objects:', initialObjects);
});

// Handle receiving new objects
socket.on('object-received', (obj) => {
    objects.push(obj);
    console.log('\n[CLIENT] Received new object:', obj);
    showMenu();
});

function showMenu() {
    console.log('\n[CLIENT] --- Menu ---');
    console.log('[CLIENT] a) Send object');
    console.log('[CLIENT] b) Display objects received');
    console.log('[CLIENT] c) Quit');
    console.log('[CLIENT] Choose an option: ');
}

function handleUserInput() {
    rl.question('', (choice) => {
        switch(choice.toLowerCase()) {
            case 'a':
                rl.question('[CLIENT] Enter object name: ', (name) => {
                    rl.question('[CLIENT] Enter object value: ', (value) => {
                        const obj = { 
                            name, 
                            value, 
                            timestamp: new Date().toISOString(),
                            source: 'client'
                        };
                        socket.emit('new-object', obj);
                        objects.push(obj);
                        console.log('[CLIENT] Object sent:', obj);
                        showMenu();
                        handleUserInput();
                    });
                });
                break;
            
            case 'b':
                console.log('\n[CLIENT] All objects received:');
                objects.forEach((obj, index) => {
                    console.log(`[CLIENT] ${index + 1}:`, obj);
                });
                showMenu();
                handleUserInput();
                break;
            
            case 'c':
                console.log('[CLIENT] Goodbye!');
                socket.disconnect();
                rl.close();
                process.exit(0);
                break;
            
            default:
                console.log('[CLIENT] Invalid option. Please try again.');
                showMenu();
                handleUserInput();
        }
    });
}

// Start the application
console.log('[CLIENT] Connecting to server on port', SERVER_PORT);
socket.on('connect', () => {
    console.log('[CLIENT] Connected to server!');
    showMenu();
    handleUserInput();
});

socket.on('connect_error', (error) => {
    console.log('[CLIENT] Connection error:', error.message);
    console.log('[CLIENT] Make sure the server is running on http://localhost:', SERVER_PORT);
    process.exit(1);
});
