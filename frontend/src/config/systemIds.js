// Special system UUIDs
export const SYSTEM_IDS = {
  SYSTEM: '00000000-0000-0000-0000-000000000000',
  GAME_MASTER: '00000000-0000-0000-0000-000000000100',
  NEWS: '00000000-0000-0000-0000-000000000200'
};

// Display names for special senders
export const SPECIAL_SENDERS = {
  [SYSTEM_IDS.SYSTEM]: {
    nickname: 'System',
    color: '#ffff00' // Changed to yellow
  },
  [SYSTEM_IDS.GAME_MASTER]: {
    nickname: 'Game Master',
    color: '#ffa500'
  },
  [SYSTEM_IDS.NEWS]: {
    nickname: 'News',
    color: '#00ff00'
  }
};