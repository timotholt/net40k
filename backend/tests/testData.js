// testData.js
export const testUsers = [
  {
    username: 'player1',
    nickname: 'Pro Gamer',
    password: 'password123'
  },
  {
    username: 'player2',
    nickname: 'Casual Gamer',
    password: 'password456'
  },
  {
    username: 'player3',
    nickname: 'Speed Runner',
    password: 'password789'
  }
];

export const testGames = [
  {
    name: 'Casual Match',
    maxPlayers: 2,
    password: ''
  },
  {
    name: 'Pro Tournament',
    maxPlayers: 4,
    password: 'secret'
  },
  {
    name: 'Practice Room',
    maxPlayers: 3,
    password: ''
  }
];

export const createTestChats = (userId, gameId, username, nickname) => {
  // Create Date objects for messages
  const now = new Date();
  const oneMinuteAgo = new Date(now - 60000);  // 1 minute ago
  const fiveMinutesAgo = new Date(now - 300000);  // 5 minutes ago

  return [
    {
      type: 'lobby',
      userId,
      username,
      nickname,
      message: 'Hello everyone!',
      private: false,
      timestamp: fiveMinutesAgo,
      created: fiveMinutesAgo,
      createdAt: fiveMinutesAgo
    },
    {
      type: 'game',
      userId,
      gameId: gameId,
      username,
      nickname,
      message: 'Good game!',
      private: false,
      timestamp: oneMinuteAgo,
      created: oneMinuteAgo,
      createdAt: oneMinuteAgo
    },
    {
      type: 'lobby',
      userId,
      username,
      nickname,
      message: 'Private message',
      private: true,
      recipientId: userId,
      timestamp: now,
      created: now,
      createdAt: now
    }
  ];
};