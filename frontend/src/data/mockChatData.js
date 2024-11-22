import { SYSTEM_IDS } from '../config/systemIds';
import { createMessageUuid } from 'shared/constants/GameUuids';

// Helper function to generate timestamps
const getTimestamp = (minutesAgo) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

export const mockGameMasterMessages = [
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Your turn in 'Test Game 1'",
    timestamp: getTimestamp(30),
    metaData: {
      gameId: "1",
      gameName: "Test Game 1"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Player 1 has invited you to join 'Password Game'",
    timestamp: getTimestamp(25),
    metaData: {
      gameId: "2",
      gameName: "Password Game",
      inviterId: "1",
      inviterName: "Player 1"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Game 'Test Game 1' has started",
    timestamp: getTimestamp(20)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Your turn in 'Password Game'",
    timestamp: getTimestamp(15),
    metaData: {
      gameId: "2",
      gameName: "Password Game"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Player 2 has invited you to join 'Quick Match'",
    timestamp: getTimestamp(10),
    metaData: {
      gameId: "6",
      gameName: "Quick Match",
      inviterId: "2",
      inviterName: "Player 2"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Game 'Password Game' has ended",
    timestamp: getTimestamp(5)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Player 3 has invited you to join 'Tournament Game'",
    timestamp: getTimestamp(4),
    metaData: {
      gameId: "7",
      gameName: "Tournament Game",
      inviterId: "3",
      inviterName: "Player 3"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Your turn in 'Quick Match'",
    timestamp: getTimestamp(3),
    metaData: {
      gameId: "6",
      gameName: "Quick Match"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Game 'Tournament Game' is starting soon",
    timestamp: getTimestamp(2)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.GAME_MASTER,
    nickname: "Game Master",
    message: "Your turn in 'Tournament Game'",
    timestamp: getTimestamp(1),
    metaData: {
      gameId: "7",
      gameName: "Tournament Game"
    }
  }
];

export const mockLobbyMessages = [
  {
    messageUuid: createMessageUuid(),
    userUuid: "11111111-1111-1111-1111-111111111111",
    nickname: "Player 1",
    message: "Hello everyone!",
    timestamp: getTimestamp(30)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "22222222-2222-2222-2222-222222222222",
    nickname: "Player 2",
    message: "Hi there! Anyone up for a game?",
    timestamp: getTimestamp(25)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Welcome to the lobby chat!",
    timestamp: getTimestamp(20)
  }
];

export const mockWhisperMessages = [
  {
    messageUuid: createMessageUuid(),
    userUuid: "3",
    nickname: "Player 3",
    message: "Hey, want to join my game?",
    timestamp: getTimestamp(25),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "4",
    nickname: "Player 4",
    message: "Thanks for the help earlier!",
    timestamp: getTimestamp(20),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "5",
    nickname: "Player 5",
    message: "Good strategy in that last game",
    timestamp: getTimestamp(15),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "6",
    nickname: "Player 6",
    message: "Want to team up?",
    timestamp: getTimestamp(10),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "7",
    nickname: "Player 7",
    message: "Nice moves!",
    timestamp: getTimestamp(8),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "8",
    nickname: "Player 8",
    message: "Let's play again sometime",
    timestamp: getTimestamp(5),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "9",
    nickname: "Player 9",
    message: "Need one more for our team",
    timestamp: getTimestamp(4),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "10",
    nickname: "Player 10",
    message: "Ready for the tournament?",
    timestamp: getTimestamp(2),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "1",
    nickname: "Player 1",
    message: "Check out my new strategy",
    timestamp: getTimestamp(1),
    metaData: {
      isWhisper: true
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: "2",
    nickname: "Player 2",
    message: "Want to practice before the match?",
    timestamp: getTimestamp(0),
    metaData: {
      isWhisper: true
    }
  }
];

export const mockSystemMessages = [
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Server maintenance completed successfully",
    timestamp: getTimestamp(30)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "New game version deployed",
    timestamp: getTimestamp(25)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Server will restart in 30 minutes",
    timestamp: getTimestamp(20)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Chat system updated",
    timestamp: getTimestamp(15)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Weekend event activated",
    timestamp: getTimestamp(10)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Server performance optimizations complete",
    timestamp: getTimestamp(8)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Daily challenges reset",
    timestamp: getTimestamp(6)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Tournament registration opened",
    timestamp: getTimestamp(4)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "Server backup in progress",
    timestamp: getTimestamp(2)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.SYSTEM,
    nickname: "System",
    message: "System status: All services operational",
    timestamp: getTimestamp(1)
  }
];

export const mockNewsMessages = [
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Welcome to Game Server v1.0!",
    timestamp: getTimestamp(60)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Check out our latest patch notes!",
    timestamp: getTimestamp(50),
    metaData: {
      url: "https://example.com/patch-notes"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Weekend tournament starting soon - Click for details",
    timestamp: getTimestamp(40),
    metaData: {
      url: "https://example.com/tournament"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Server maintenance scheduled",
    timestamp: getTimestamp(30)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Join our Discord community!",
    timestamp: getTimestamp(20),
    metaData: {
      url: "https://discord.gg/example"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "New game mode released - Learn more",
    timestamp: getTimestamp(15),
    metaData: {
      url: "https://example.com/new-mode"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Balance updates coming next week",
    timestamp: getTimestamp(10)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Special event this weekend - Details here",
    timestamp: getTimestamp(5),
    metaData: {
      url: "https://example.com/event"
    }
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "New achievements available",
    timestamp: getTimestamp(2)
  },
  {
    messageUuid: createMessageUuid(),
    userUuid: SYSTEM_IDS.NEWS,
    nickname: "News",
    message: "Rate us on the app store!",
    timestamp: getTimestamp(1),
    metaData: {
      url: "https://example.com/rate"
    }
  }
];