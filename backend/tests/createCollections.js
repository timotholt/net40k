const { MongoClient } = require('mongodb');

// Get MongoDB connection string from .env file through dotenv module
require('dotenv').config();

export async function createDatabaseAndUserCollection() {

    // Get MongoDB connection string from .env file
    const MONGODB_URI = process.env.MONGODB_URI;
    
    // Open MongoDB client
    const client = new MongoClient(uri);

    try {
        await client.connect();

        // If the database "hack40k" doesn't exist, create it
        const databaseList = await client.db().admin().listDatabases();
        const databaseNames = databaseList.databases.map(db => db.name);
        if (!databaseNames.includes("hack40k")) {
            await client.db().admin().createDatabase("hack40k");
        }

        // If the collection "users" doesn't exist, create it
        const collectionList = await client.db("hack40k").listCollections().toArray();
        const collectionNames = collectionList.map(collection => collection.name);
        if (!collectionNames.includes("users")) {
            await client.db("hack40k").createCollection("users");
        }

        // Define the validation rule
        const validationRule = {
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

        // Apply the validation rule to the collection
        await collection.command({
            collMod: "users",
            validator: validationRule,
            validationLevel: "strict"
        });

        console.log("Database and collection created with validation rule applied.");
    } catch (err) {
        console.error(err.stack);
    } finally {
        await client.close();
    }
}

// Based upon the validation rules above,here is a array of users that match the validation rules
const users = [
    { username: "test1", password: "test1", userId: "test1", deleted: false, nickname: "test1" },
    { username: "test2", password: "test2", userId: "test2", deleted: false, nickname: "test2" },
    { username: "test3", password: "test3", userId: "test3", deleted: false, nickname: "test3" },
];
