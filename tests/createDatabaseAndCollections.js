const { MongoClient } = require('mongodb');
const fs = require('fs');

// We will use dotenv to load environment variables from a .env file
require('dotenv').config();

// Define the validation rule for the "user" collection
const userValidationRule = {
    $jsonSchema: {
        bsonType: "object",
        required: ["username", "password", "userId", "deleted", "nickname"],
        properties: {
        _id: {
            bsonType: "objectId"
        },
        username: {
            bsonType: "string",
            minLength: 5,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$"
        },
        password: {
            bsonType: "string",
            minLength: 8,
            maxLength: 32,
            pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$"
        },
        userId: {
            bsonType: "string",
            pattern: /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
        },
        deleted: {
            bsonType: "bool"
        },
        nickname: {
            bsonType: "string",
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z][a-zA-Z0-9_.'-]*$"
        }
        }
    }
};


export async function initializeDatabase() {
    // Get mongoDB connection string from .env file
    const MONGODB_URI = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    console.log('Initializing database, using connection string:', MONGODB_URI);

    try {
        await client.connect();

        // Create the 'hack40k' database if it doesn't exist
        const database = client.db('hack40k');
        // Create collections if they don't exist (with validation for "user")
        await database.createCollection('user', { validator: userValidationRule });
        await database.createCollection('gamestate');
        await database.createCollection('chat');

        // Clear existing data from collections
        await database.collection('user').deleteMany({});
        await database.collection('gamestate').deleteMany({});
        await database.collection('chat').deleteMany({});

        // Upload user data (will be validated against the schema)
        const userData = JSON.parse(fs.readFileSync('./tests/hack40k.user.json', 'utf8'));
        await database.collection('user').insertMany(userData);

        // Upload gamestate and chat data (no validation applied)
        const gamestateData = JSON.parse(fs.readFileSync('./tests/hack40k.gamestate.json', 'utf8'));
        await database.collection('gamestate').insertMany(gamestateData);

        const chatData = JSON.parse(fs.readFileSync('./tests/hack40k.chat.json', 'utf8'));
        await database.collection('chat').insertMany(chatData);

        console.log('Database initialized successfully!');
    } catch (err) {
        console.error('Error initializing database:', err);
    } finally {
        await client.close();
    }
}

//initializeDatabase();