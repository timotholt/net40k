import { 
    createUserUuid, 
    createGameRoomUuid, 
    createMessageUuid,
    COUNTRY,
    ROOM_TYPE,
    DATACENTER,
    RESOURCE_TYPE
} from '../constants/GameUuids.js';

// Test users with proper UUID format
export const testUsers = [
    {
        userUuid: '00000001-7000-0000-0000-000000000001', // User type (0), US country (00)
        password: 'password123'
    },
    {
        userUuid: '00000001-7000-0000-0000-000000000002',
        password: 'password456'
    },
    {
        userUuid: '00000001-7000-0000-0000-000000000003',
        password: 'password789'
    }
];

// Games with proper UUID format
export const testGames = [
    {
        gameUuid: createGameRoomUuid(COUNTRY.US, ROOM_TYPE.GAME, DATACENTER.US_WEST),
        name: 'Siege of Terra',
        maxPlayers: 4,
        status: 'waiting',
        countryCode: COUNTRY.US,
        datacenterId: DATACENTER.US_WEST,
        players: [
            {
                userUuid: testUsers[0].userUuid,
                ready: true
            }
        ]
    },
    {
        gameUuid: createGameRoomUuid(COUNTRY.GB, ROOM_TYPE.GAME, DATACENTER.US_WEST),
        name: 'Defense of Cadia',
        maxPlayers: 6,
        status: 'in_progress',
        countryCode: COUNTRY.GB,
        datacenterId: DATACENTER.US_WEST,
        players: [
            {
                userUuid: testUsers[1].userUuid,
                ready: true
            },
            {
                userUuid: testUsers[2].userUuid,
                ready: true
            }
        ]
    }
];

// Chat messages with proper UUID format
export function createTestChats(senderUuid, roomUuid) {
    const baseTime = new Date('2024-01-01T10:00:00Z').getTime();
    return [
        {
            messageUuid: createMessageUuid(),
            senderUuid: senderUuid,
            roomUuid: roomUuid || createGameRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),
            message: 'For the Emperor!',
            createdAt: new Date(baseTime),
            isWhisper: false
        },
        {
            messageUuid: createMessageUuid(),
            senderUuid: senderUuid,
            roomUuid: roomUuid || createGameRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),
            message: 'Moving units to sector 5',
            createdAt: new Date(baseTime + 5 * 60 * 1000),
            isWhisper: false
        },
        {
            messageUuid: createMessageUuid(),
            senderUuid: senderUuid,
            roomUuid: roomUuid || createGameRoomUuid(COUNTRY.US, ROOM_TYPE.WHISPER, DATACENTER.US_WEST),
            recipientUuid: testUsers[1].userUuid,
            message: 'Shall we form an alliance?',
            createdAt: new Date(baseTime + 10 * 60 * 1000),
            isWhisper: true
        }
    ];
}

export const testDates = {
    'today': new Date(),
    'yesterday': new Date(Date.now() - 24 * 60 * 60 * 1000),
    'lastWeek': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
};

export const testRichMessages = {
    chats: [
        {
            messageUuid: createMessageUuid(),
            senderUuid: testUsers[0].userUuid,
            message: 'Hello everyone!',
            roomUuid: createGameRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),
            createdAt: new Date('2024-01-01T10:00:00Z'),
            isWhisper: false
        },
        {
            messageUuid: createMessageUuid(),
            senderUuid: testUsers[1].userUuid,
            message: 'Join my game!',
            roomUuid: createGameRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),
            createdAt: new Date('2024-01-01T10:05:00Z'),
            isWhisper: false,
            metadata: {
                type: 'GAME_LINK',
                gameUuid: testGames[0].gameUuid,
                action: 'join'
            }
        },
        {
            messageUuid: createMessageUuid(),
            senderUuid: testUsers[0].userUuid,
            message: 'Join our Discord server: https://discord.gg/warhammer40k',
            roomUuid: createGameRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),
            createdAt: new Date('2024-01-01T10:10:00Z'),
            isWhisper: false,
            metadata: {
                type: 'EXTERNAL_LINK',
                url: 'https://discord.gg/warhammer40k'
            }
        },
        {
            messageUuid: createMessageUuid(),
            senderUuid: testUsers[0].userUuid,
            message: 'Let\'s make an alliance',
            roomUuid: createGameRoomUuid(COUNTRY.US, ROOM_TYPE.WHISPER, DATACENTER.US_WEST),
            createdAt: new Date('2024-01-01T10:15:00Z'),
            isWhisper: true,
            recipientUuid: testUsers[1].userUuid
        }
    ]
};