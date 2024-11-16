// Special system UUIDs
export const SYSTEM_IDS = {
  SYSTEM: '00000000-0000-0000-0000-000000000000',
  GAME_MASTER: '00000000-0000-0000-0000-000000000100',
  NEWS: '00000000-0000-0000-0000-000000000200'
};

// Display names for special senders
export const SPECIAL_SENDERS = {
  [SYSTEM_IDS.SYSTEM]: {
    username: 'System',
    color: '#ffff00' // Changed to yellow
  },
  [SYSTEM_IDS.GAME_MASTER]: {
    username: 'Game Master',
    color: '#ffa500'
  },
  [SYSTEM_IDS.NEWS]: {
    username: 'News',
    color: '#00ff00'
  }
};