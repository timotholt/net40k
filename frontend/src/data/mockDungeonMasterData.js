// DM (Dungeon Master) configuration
export const DM_CONFIG = {
  id: "dm_system",
  username: "Dungeon Master",
  displayName: "DM",
  color: "#ffa500" // Orange color for DM messages
};

// Mock DM messages for testing invite functionality
export const mockDMMessages = [
  {
    id: "dm_1",
    userId: DM_CONFIG.id,
    username: DM_CONFIG.username,
    message: "You have been invited to join Player 1's game - Test Game 1",
    timestamp: new Date(Date.now() - 180000).toISOString(),
    type: "game_invite",
    data: {
      gameId: "1",
      gameName: "Test Game 1",
      inviterId: "1",
      inviterName: "Player 1"
    }
  },
  {
    id: "dm_2",
    userId: DM_CONFIG.id,
    username: DM_CONFIG.username,
    message: "You have been invited to join Player 2's game - Password Game",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: "game_invite",
    data: {
      gameId: "2",
      gameName: "Password Game",
      inviterId: "2",
      inviterName: "Player 2"
    }
  },
  {
    id: "dm_3",
    userId: DM_CONFIG.id,
    username: DM_CONFIG.username,
    message: "Player 3 declined your game invite",
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: "invite_declined",
    data: {
      gameId: "3",
      inviteeId: "3",
      inviteeName: "Player 3"
    }
  }
];