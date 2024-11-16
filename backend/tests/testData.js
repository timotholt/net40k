import { UuidService } from '../services/UuidService.js';

export const testUsers = [
    {
        username: 'player1',
        nickname: 'Player One',
        password: 'password123'
    },
    {
        username: 'player2',
        nickname: 'Player Two',
        password: 'password456'
    },
    {
        username: 'player3',
        nickname: 'Player Three',
        password: 'password789'
    }
];

export const testGames = [
    {
        name: 'Test Game 1',
        maxPlayers: 4,
        status: 'waiting'
    },
    {
        name: 'Test Game 2',
        maxPlayers: 6,
        status: 'in_progress'
    },
    {
        name: 'Test Game 3',
        maxPlayers: 2,
        status: 'completed'
    }
];

export function createTestChats(userId, gameId, username, nickname) {
    return [
        {
            type: 'lobby',
            userId: userId,
            username: username,
            nickname: nickname,
            message: 'Hello from lobby!'
        },
        {
            type: 'game',
            userId: userId,
            gameId: gameId,
            username: username,
            nickname: nickname,
            message: 'Game strategy discussion'
        },
        {
            type: 'private',
            userId: userId,
            username: username,
            nickname: nickname,
            message: 'Private message test'
        }
    ];
}

export const testDates = {
    'today': new Date(),
    'yesterday': new Date(Date.now() - 24 * 60 * 60 * 1000),
    'lastWeek': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
};