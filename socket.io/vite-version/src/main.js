import { io } from 'socket.io-client';

// Initialize socket connection
const SERVER_PORT = 3002;
const socket = io(`http://localhost:${SERVER_PORT}`);
const sentObjects = [];
const receivedObjects = [];

// DOM elements
const inputForm = document.getElementById('inputForm');
const objectName = document.getElementById('objectName');
const objectValue = document.getElementById('objectValue');
const sendObjectBtn = document.getElementById('sendObject');
const submitObjectBtn = document.getElementById('submitObject');
const cancelInputBtn = document.getElementById('cancelInput');
const displayObjectsBtn = document.getElementById('displayObjects');
const quitBtn = document.getElementById('quit');
const objectList = document.getElementById('objectList');
const consoleOutput = document.getElementById('console');

// Console logging function
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    consoleOutput.textContent = `[${timestamp}] ${message}\n` + consoleOutput.textContent;
}

// Handle receiving initial objects
socket.on('initial-objects', (objects) => {
    sentObjects.push(...objects.sent);
    receivedObjects.push(...objects.received);
    log('[CLIENT] Connected to server on port ' + SERVER_PORT);
    log('[CLIENT] Received initial state');
});

// Handle receiving new objects
socket.on('object-received', (obj) => {
    if (obj.source === 'server') {
        receivedObjects.push(obj);
        log('[CLIENT] Received new object from server: ' + JSON.stringify(obj));
        updateDisplay();
    }
});

// Menu handlers
sendObjectBtn.addEventListener('click', () => {
    inputForm.style.display = 'block';
    objectName.focus();
});

submitObjectBtn.addEventListener('click', () => {
    if (objectName.value && objectValue.value) {
        const obj = {
            name: objectName.value,
            value: objectValue.value,
            timestamp: new Date().toISOString(),
            source: 'client'
        };
        
        socket.emit('new-object', obj);
        sentObjects.push(obj);
        log('[CLIENT] Object sent: ' + JSON.stringify(obj));
        updateDisplay();
        
        // Clear and hide form
        objectName.value = '';
        objectValue.value = '';
        inputForm.style.display = 'none';
    } else {
        log('[CLIENT] Please enter both name and value');
    }
});

cancelInputBtn.addEventListener('click', () => {
    objectName.value = '';
    objectValue.value = '';
    inputForm.style.display = 'none';
});

displayObjectsBtn.addEventListener('click', () => {
    updateDisplay();
    log('[CLIENT] Displaying all objects');
});

quitBtn.addEventListener('click', () => {
    log('[CLIENT] Disconnecting from server...');
    socket.disconnect();
    setTimeout(() => window.close(), 1000);
});

// Update the display of objects
function updateDisplay() {
    const display = {
        "Sent Objects": sentObjects,
        "Received Objects": receivedObjects
    };
    objectList.textContent = JSON.stringify(display, null, 2);
}

// Connection status handling
socket.on('connect', () => {
    log('[CLIENT] Connected to server!');
});

socket.on('connect_error', (error) => {
    log('[CLIENT] Connection error: ' + error.message);
    log('[CLIENT] Make sure the server is running on http://localhost:' + SERVER_PORT);
});
