import { SYSTEM_IDS } from '../config/systemIds';

// Helper function to generate timestamps
const getTimestamp = (minutesAgo) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
};

export const mockGameMasterMessages = [
  {
    id: 1,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Your turn in 'Test Game 1'",
    timestamp: getTimestamp(30),
    hasAction: true,
    type: "game_turn",
    data: {
      gameId: "1",
      gameName: "Test Game 1"
    }
  },
  {
    id: 2,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Player 1 has invited you to join 'Password Game'",
    timestamp: getTimestamp(25),
    hasAction: true,
    type: "game_invite",
    data: {
      gameId: "2",
      gameName: "Password Game",
      inviterId: "1",
      inviterName: "Player 1"
    }
  },
  {
    id: 3,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Game 'Test Game 1' has started",
    timestamp: getTimestamp(20)
  },
  {
    id: 4,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Your turn in 'Password Game'",
    timestamp: getTimestamp(15),
    hasAction: true,
    type: "game_turn",
    data: {
      gameId: "2",
      gameName: "Password Game"
    }
  },
  {
    id: 5,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Player 2 has invited you to join 'Quick Match'",
    timestamp: getTimestamp(10),
    hasAction: true,
    type: "game_invite",
    data: {
      gameId: "6",
      gameName: "Quick Match",
      inviterId: "2",
      inviterName: "Player 2"
    }
  },
  {
    id: 6,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Game 'Password Game' has ended",
    timestamp: getTimestamp(5)
  },
  {
    id: 7,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Player 3 has invited you to join 'Tournament Game'",
    timestamp: getTimestamp(4),
    hasAction: true,
    type: "game_invite",
    data: {
      gameId: "7",
      gameName: "Tournament Game",
      inviterId: "3",
      inviterName: "Player 3"
    }
  },
  {
    id: 8,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Your turn in 'Quick Match'",
    timestamp: getTimestamp(3),
    hasAction: true,
    type: "game_turn",
    data: {
      gameId: "6",
      gameName: "Quick Match"
    }
  },
  {
    id: 9,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Game 'Tournament Game' is starting soon",
    timestamp: getTimestamp(2)
  },
  {
    id: 10,
    userId: SYSTEM_IDS.GAME_MASTER,
    message: "Your turn in 'Tournament Game'",
    timestamp: getTimestamp(1),
    hasAction: true,
    type: "game_turn",
    data: {
      gameId: "7",
      gameName: "Tournament Game"
    }
  }
];

export const mockLobbyMessages = [
  {
    id: 1,
    userId: "1",
    username: "Player 1",
    message: "Hello everyone!",
    timestamp: getTimestamp(30)
  },
  {
    id: 2,
    userId: "2",
    username: "Player 2",
    message: "Hi there!",
    timestamp: getTimestamp(25)
  },
  {
    id: 3,
    userId: "3",
    username: "Player 3",
    message: "Anyone up for a game?",
    timestamp: getTimestamp(20)
  },
  {
    id: 4,
    userId: "4",
    username: "Player 4",
    message: "I'll join!",
    timestamp: getTimestamp(15)
  },
  {
    id: 5,
    userId: "5",
    username: "Player 5",
    message: "Great match everyone!",
    timestamp: getTimestamp(10)
  },
  {
    id: 6,
    userId: "6",
    username: "Player 6",
    message: "Thanks for the game",
    timestamp: getTimestamp(8)
  },
  {
    id: 7,
    userId: "7",
    username: "Player 7",
    message: "Who's up for another round?",
    timestamp: getTimestamp(6)
  },
  {
    id: 8,
    userId: "8",
    username: "Player 8",
    message: "Count me in!",
    timestamp: getTimestamp(4)
  },
  {
    id: 9,
    userId: "9",
    username: "Player 9",
    message: "Good game!",
    timestamp: getTimestamp(2)
  },
  {
    id: 10,
    userId: "10",
    username: "Player 10",
    message: "See you tomorrow!",
    timestamp: getTimestamp(1)
  }
];

export const mockWhisperMessages = [
  {
    id: 1,
    userId: "3",
    username: "Player 3",
    message: "Hey, want to join my game?",
    timestamp: getTimestamp(25),
    isWhisper: true
  },
  {
    id: 2,
    userId: "4",
    username: "Player 4",
    message: "Thanks for the help earlier!",
    timestamp: getTimestamp(20),
    isWhisper: true
  },
  {
    id: 3,
    userId: "5",
    username: "Player 5",
    message: "Good strategy in that last game",
    timestamp: getTimestamp(15),
    isWhisper: true
  },
  {
    id: 4,
    userId: "6",
    username: "Player 6",
    message: "Want to team up?",
    timestamp: getTimestamp(10),
    isWhisper: true
  },
  {
    id: 5,
    userId: "7",
    username: "Player 7",
    message: "Nice moves!",
    timestamp: getTimestamp(8),
    isWhisper: true
  },
  {
    id: 6,
    userId: "8",
    username: "Player 8",
    message: "Let's play again sometime",
    timestamp: getTimestamp(6),
    isWhisper: true
  },
  {
    id: 7,
    userId: "9",
    username: "Player 9",
    message: "Need one more for our team",
    timestamp: getTimestamp(4),
    isWhisper: true
  },
  {
    id: 8,
    userId: "10",
    username: "Player 10",
    message: "Ready for the tournament?",
    timestamp: getTimestamp(2),
    isWhisper: true
  },
  {
    id: 9,
    userId: "1",
    username: "Player 1",
    message: "Check out my new strategy",
    timestamp: getTimestamp(1),
    isWhisper: true
  },
  {
    id: 10,
    userId: "2",
    username: "Player 2",
    message: "Want to practice before the match?",
    timestamp: getTimestamp(0),
    isWhisper: true
  }
];

export const mockSystemMessages = [
  {
    id: 1,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Server maintenance completed successfully",
    timestamp: getTimestamp(30)
  },
  {
    id: 2,
    userId: SYSTEM_IDS.SYSTEM,
    message: "New game version deployed",
    timestamp: getTimestamp(25)
  },
  {
    id: 3,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Server will restart in 30 minutes",
    timestamp: getTimestamp(20)
  },
  {
    id: 4,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Chat system updated",
    timestamp: getTimestamp(15)
  },
  {
    id: 5,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Weekend event activated",
    timestamp: getTimestamp(10)
  },
  {
    id: 6,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Server performance optimizations complete",
    timestamp: getTimestamp(8)
  },
  {
    id: 7,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Daily challenges reset",
    timestamp: getTimestamp(6)
  },
  {
    id: 8,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Tournament registration opened",
    timestamp: getTimestamp(4)
  },
  {
    id: 9,
    userId: SYSTEM_IDS.SYSTEM,
    message: "Server backup in progress",
    timestamp: getTimestamp(2)
  },
  {
    id: 10,
    userId: SYSTEM_IDS.SYSTEM,
    message: "System status: All services operational",
    timestamp: getTimestamp(1)
  }
];

export const mockNewsMessages = [
  {
    id: 1,
    userId: SYSTEM_IDS.NEWS,
    message: "Welcome to Game Server v1.0!",
    timestamp: getTimestamp(60)
  },
  {
    id: 2,
    userId: SYSTEM_IDS.NEWS,
    message: "Check out our latest patch notes!",
    timestamp: getTimestamp(50),
    hasAction: true,
    type: "news_link",
    data: {
      url: "https://example.com/patch-notes"
    }
  },
  {
    id: 3,
    userId: SYSTEM_IDS.NEWS,
    message: "Weekend tournament starting soon - Click for details",
    timestamp: getTimestamp(40),
    hasAction: true,
    type: "news_link",
    data: {
      url: "https://example.com/tournament"
    }
  },
  {
    id: 4,
    userId: SYSTEM_IDS.NEWS,
    message: "Server maintenance scheduled",
    timestamp: getTimestamp(30)
  },
  {
    id: 5,
    userId: SYSTEM_IDS.NEWS,
    message: "Join our Discord community!",
    timestamp: getTimestamp(20),
    hasAction: true,
    type: "news_link",
    data: {
      url: "https://discord.gg/example"
    }
  },
  {
    id: 6,
    userId: SYSTEM_IDS.NEWS,
    message: "New game mode released - Learn more",
    timestamp: getTimestamp(15),
    hasAction: true,
    type: "news_link",
    data: {
      url: "https://example.com/new-mode"
    }
  },
  {
    id: 7,
    userId: SYSTEM_IDS.NEWS,
    message: "Balance updates coming next week",
    timestamp: getTimestamp(10)
  },
  {
    id: 8,
    userId: SYSTEM_IDS.NEWS,
    message: "Special event this weekend - Details here",
    timestamp: getTimestamp(5),
    hasAction: true,
    type: "news_link",
    data: {
      url: "https://example.com/event"
    }
  },
  {
    id: 9,
    userId: SYSTEM_IDS.NEWS,
    message: "New achievements available",
    timestamp: getTimestamp(2)
  },
  {
    id: 10,
    userId: SYSTEM_IDS.NEWS,
    message: "Rate us on the app store!",
    timestamp: getTimestamp(1),
    hasAction: true,
    type: "news_link",
    data: {
      url: "https://example.com/rate"
    }
  }
];