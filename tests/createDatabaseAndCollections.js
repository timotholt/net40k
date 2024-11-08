import { MongoClient } from 'mongodb';
import fs from 'fs';

// We will use dotenv to load environment variables from a .env file
import dotenv from 'dotenv';

// Define the validation rule for the "user" collection
const userValidationRule = {
    $jsonSchema: {
        // required: ["username", "password", "userId", "deleted", "nickname"],
        properties: {
            // _id: {
            //     bsonType: "objectId"
            // },
            username: {
                bsonType: "string",
                minLength: 5,
                maxLength: 20,
                pattern: "^[a-zA-Z0-9_]+$"
            },
            password: {
                bsonType: "string",
                minLength: 8,
                maxLength: 36,
            //     // pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$"
            //     pattern: "^(?=.*[a-zA-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+-=[]{};':\"\\\\|,.<>/\\?~`]).{8,}$",
            },
            userId: {
                bsonType: "string",
            },
            deleted: {
                bsonType: "bool"
            },
            nickname: {
                bsonType: "string",
                minLength: 3,
                maxLength: 30,
                // pattern: "^[a-zA-Z][a-zA-Z0-9_.'\\ -]*$"

                // Include unicode A-Z and !
                // pattern: "^[A-Za-zÀ-ÖØ-öø-ū0-9][A-Za-zÀ-ÖØ-öø-ū0-9_.'\\ -!]*$"

                // Better! Try to include more such as !~@#$%^& 
                // pattern: "^[A-Za-zÀ-ÖØ-öø-ū0-9][A-Za-zÀ-ÖØ-öø-ū0-9_.'\\ -!~@#$%^&]*$"

                // Better!  Includes {}<> (THIS IS THE CURRENT BEST ONE)
                pattern: "^[A-Za-zÀ-ÖØ-öø-ū0-9][A-Za-zÀ-ÖØ-öø-ū0-9_.'\\ -!~@#$%^&{}<>]*$"

                // THESE BELOW DONT WORK
                // pattern: "^[A-Za-zÀ-ÖØ-öø-ū][A-Za-zÀ-ÖØ-öø-ū0-9_.\'\\-`~!@#$%^&*()_+={[\]}\\s]*$"
                // pattern: "^[A-Za-zÀ-ÖØ-öø-ū][A-Za-zÀ-ÖØ-öø-ū0-9_.\'\\-`~!@#$%^&*()_+={[\]}\s]*$"
            }
        }
    },
};


export async function initializeDatabase() {

    // Get mongoDB connection string from .env file
    dotenv.config();

    const MONGODB_URI = process.env.MONGODB_URI;    
    console.log('Initializing database, using connection string:', MONGODB_URI);

    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();

        // Create the 'hack40k' database if it doesn't exist
        const database = client.db('hack40k');

        // Drop all the collections
        await database.dropCollection('user');
        await database.dropCollection('gamestate');
        await database.dropCollection('chat');

        // Create collections if they don't exist (with validation for "user")
        await database.createCollection('user', { validator: userValidationRule, validationAction: "warn" });
        // await database.createCollection('user');
        await database.createCollection('gamestate');
        await database.createCollection('chat');

        // Clear existing data from collections
        await database.collection('user').deleteMany({});
        await database.collection('gamestate').deleteMany({});
        await database.collection('chat').deleteMany({});

        // Create indexes for the user & gamestate collections
        await database.collection('user').createIndex({ username: 1 }, { unique: true });
        await database.collection('user').createIndex({ userId: 1 }, { unique: true });
        await database.collection('gamestate').createIndex({ id: 1 }, { unique: true });

        // These are for future use
        //await database.collection('chat').createIndex({ chatId: 1 }, { unique: true });

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