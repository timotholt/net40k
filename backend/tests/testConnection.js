import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    const client = new MongoClient(process.env.MONGODB_URI);
    
    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected successfully!');
        
        const db = client.db(process.env.MONGODB_DATABASE);
        console.log(`\nDatabase: ${process.env.MONGODB_DATABASE}`);
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log('\nCollections:');
        if (collections.length === 0) {
            console.log('No collections found');
        } else {
            collections.forEach(col => console.log(`- ${col.name}`));
        }
        
        // Get database stats
        const stats = await db.stats();
        console.log('\nDatabase Stats:');
        console.log(`- Collections: ${stats.collections}`);
        console.log(`- Objects: ${stats.objects}`);
        console.log(`- Storage Size: ${Math.round(stats.storageSize / 1024 / 1024)}MB`);
        
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        await client.close();
        console.log('\nConnection closed');
    }
}

testConnection();
