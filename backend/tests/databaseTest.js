import { db } from '../database/database.js';
import { UserDB } from '../models/User.js';
import { GameStateDB } from '../models/GameState.js';
import { ChatDB } from '../models/Chat.js';
import { testUsers, testGames, createTestChats } from './testData.js';

async function testUserOperations() {
    console.log('\n=== Testing User Operations ===');
    
    // Create users
    console.log('\nCreating users...');
    const createdUsers = [];
    for (const userData of testUsers) {
        const user = await UserDB.create(userData);
        console.log(`Created user: ${user.username}`);
        createdUsers.push(user);
    }

    // Find users
    console.log('\nFinding users...');
    const foundUser = await UserDB.findByUsername(createdUsers[0].username);
    console.log(`Found user by username: ${foundUser.username}`);

    // Update user
    console.log('\nUpdating user...');
    await UserDB.updateById(createdUsers[0].userId, { nickname: 'Updated Nickname' });
    console.log(`Updated user nickname`);

    // Soft delete user
    console.log('\nSoft deleting user...');
    await UserDB.softDelete(createdUsers[1].userId);
    console.log(`Soft deleted user: ${createdUsers[1].username}`);

    return createdUsers;
}

async function testGameOperations(creatorId) {
    console.log('\n=== Testing Game Operations ===');

    // Create games
    console.log('\nCreating games...');
    const createdGames = [];
    for (const gameData of testGames) {
        const game = await GameStateDB.create({
            ...gameData,
            creator: creatorId
        });
        console.log(`Created game: ${game.name}`);
        createdGames.push(game);
    }

    // Add players to game
    console.log('\nAdding players to game...');
    await GameStateDB.addPlayer(createdGames[0].id, creatorId);
    console.log(`Added player to game: ${createdGames[0].name}`);

    // Find games
    console.log('\nFinding games...');
    const foundGames = await GameStateDB.findByCreator(creatorId);
    console.log(`Found ${foundGames.length} games by creator`);

    // Remove player from game
    console.log('\nRemoving player from game...');
    await GameStateDB.removePlayer(createdGames[0].id, creatorId);
    console.log(`Removed player from game: ${createdGames[0].name}`);

    return createdGames;
}

async function testChatOperations(user, game) {
    console.log('\n=== Testing Chat Operations ===');

    // Create chat messages
    console.log('\nCreating chat messages...');
    const testChats = createTestChats(
        user.userId,
        game.id,
        user.username,
        user.nickname
    );

    const createdMessages = [];
    for (const chatData of testChats) {
        try {
            console.log('Creating chat message:', {
                type: chatData.type,
                gameId: chatData.gameId,
                message: chatData.message
            });
            
            const message = await ChatDB.create(chatData);
            console.log(`Created message with ID:`, message._id);
            
            if (!message || !message.type || !message.message) {
                throw new Error(`Invalid message created: ${JSON.stringify(message)}`);
            }

            if (message.type === 'game' && !message.gameId) {
                throw new Error(`Game message created without gameId: ${JSON.stringify(message)}`);
            }

            if (message.private && !message.recipientId) {
                throw new Error(`Private message created without recipientId: ${JSON.stringify(message)}`);
            }

            console.log('Created message:', {
                type: message.type,
                gameId: message.gameId,
                message: message.message,
                success: true
            });
            createdMessages.push(message);
        } catch (error) {
            console.error('Failed to create chat message:', error);
            console.error('Failed chat data:', chatData);
            console.error('Stack trace:', error.stack);
        }
    }

    if (createdMessages.length !== testChats.length) {
        console.error(`Expected to create ${testChats.length} messages, but created ${createdMessages.length}`);
    }

    // Find lobby messages
    console.log('\nFinding lobby messages...');
    const lobbyMessages = await ChatDB.findByType('lobby');
    console.log(`Found ${lobbyMessages.length} lobby messages`);
    console.log('Lobby messages:', lobbyMessages.map(msg => ({
        type: msg.type,
        message: msg.message,
        private: msg.private
    })));

    // Find game messages
    console.log('\nFinding game messages...');
    console.log(`Searching for game messages with gameId: ${game.id}`);
    const gameMessages = await ChatDB.findByGame(game.id);
    console.log(`Found ${gameMessages.length} game messages`);
    console.log('Game messages:', gameMessages.map(msg => ({
        type: msg.type,
        gameId: msg.gameId,
        message: msg.message
    })));

    return createdMessages;
}

async function cleanup(users, games, messages) {
    console.log('\n=== Cleaning Up Test Data ===');

    // Delete chat messages by type
    console.log('\nDeleting chat messages by type...');
    
    // Delete lobby messages
    console.log('Deleting lobby messages...');
    try {
        const result = await ChatDB.delete({ type: 'lobby' });
        console.log(`Deleted ${result.deletedCount} lobby messages`);
    } catch (error) {
        console.error('Failed to delete lobby messages:', error);
    }

    // Delete game messages
    console.log('Deleting game messages...');
    try {
        const result = await ChatDB.delete({ type: 'game' });
        console.log(`Deleted ${result.deletedCount} game messages`);
    } catch (error) {
        console.error('Failed to delete game messages:', error);
    }

    // Delete private messages
    console.log('Deleting private messages...');
    try {
        const result = await ChatDB.delete({ private: true });
        console.log(`Deleted ${result.deletedCount} private messages`);
    } catch (error) {
        console.error('Failed to delete private messages:', error);
    }

    // Delete games
    console.log('\nDeleting games...');
    for (const game of games) {
        console.log(`Deleting game: ${game.id}`);
        try {
            await GameStateDB.delete({ id: game.id });
        } catch (error) {
            console.error(`Failed to delete game ${game.id}:`, error);
        }
    }

    // Delete users
    console.log('\nDeleting users...');
    for (const user of users) {
        console.log(`Deleting user: ${user.userId}`);
        try {
            await UserDB.deleteById(user.userId);
        } catch (error) {
            console.error(`Failed to delete user ${user.userId}:`, error);
        }
    }

    console.log('Cleanup completed');
}

async function testDateHandling(users, games) {
    console.log('\n=== Testing Date Handling ===');
    
    // Create chat messages with specific dates
    console.log('\nCreating chat messages with dates...');
    const testDates = {
        now: new Date(),
        pastHour: new Date(Date.now() - 3600000),  // 1 hour ago
        pastDay: new Date(Date.now() - 86400000),   // 24 hours ago
    };

    const messages = [];
    for (const [label, date] of Object.entries(testDates)) {
        try {
            const message = await ChatDB.create({
                type: 'lobby',
                userId: users[0].userId,
                username: users[0].username,
                nickname: users[0].nickname,
                message: `Test message for ${label}`,
                timestamp: date,
                created: date,
                createdAt: date
            });
            console.log(`Created message for ${label}:`, {
                messageId: message._id,
                timestamp: message.timestamp,
                created: message.created,
                createdAt: message.createdAt
            });
            messages.push(message);
        } catch (error) {
            console.error(`Failed to create message for ${label}:`, error);
        }
    }

    // Retrieve and verify dates
    console.log('\nRetrieving messages to verify dates...');
    for (const message of messages) {
        try {
            const retrieved = await ChatDB.findOne({ _id: message._id });
            if (!retrieved) {
                console.error(`Could not find message ${message._id}`);
                continue;
            }

            // Verify each date field
            ['timestamp', 'created', 'createdAt'].forEach(field => {
                const original = message[field];
                const retrieved_date = retrieved[field];

                console.log(`\nChecking ${field}:`);
                console.log(`Original: ${original} (type: ${original instanceof Date ? 'Date' : typeof original})`);
                console.log(`Retrieved: ${retrieved_date} (type: ${retrieved_date instanceof Date ? 'Date' : typeof retrieved_date})`);
                
                if (!(retrieved_date instanceof Date)) {
                    console.error(`ERROR: Retrieved ${field} is not a Date object!`);
                } else if (original.getTime() !== retrieved_date.getTime()) {
                    console.error(`ERROR: Date mismatch for ${field}!`);
                    console.error(`Original timestamp: ${original.getTime()}`);
                    console.error(`Retrieved timestamp: ${retrieved_date.getTime()}`);
                } else {
                    console.log(`✓ ${field} matches correctly`);
                }
            });
        } catch (error) {
            console.error('Error retrieving message:', error);
        }
    }

    // Clean up test messages
    // console.log('\nCleaning up test messages...');
    // for (const message of messages) {
    //     try {
    //         await ChatDB.delete({ _id: message._id });
    //     } catch (error) {
    //         console.error(`Failed to delete message ${message._id}:`, error);
    //     }
    // }
}

export async function testAllDatabaseFunctions() {
    try {
        console.log('Starting database tests...');
        
        // Ensure database is connected
        if (!db.isConnected()) {
            await db.connect();
        }

        // Run tests
        const users = await testUserOperations();
        const games = await testGameOperations(users[0].userId);
        const messages = await testChatOperations(users[0], games[0]);

        // Add the new date handling test
        await testDateHandling(users, games);

        // Clean up
//        await cleanup(users, games, messages);

        console.log('\nDatabase tests completed successfully!');
    } catch (error) {
        console.error('Database test error:', error);
        throw error;
    }
}
