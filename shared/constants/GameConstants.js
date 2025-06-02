// Shared game constants between frontend and backend

// First Founding Legions (in Legion number order)
export const CHAPTER = {
  DARK_ANGELS:    'DARK_ANGELS',     // I Legion
  WHITE_SCARS:    'WHITE_SCARS',     // V Legion
  SPACE_WOLVES:   'SPACE_WOLVES',    // VI Legion
  IMPERIAL_FISTS: 'IMPERIAL_FISTS',  // VII Legion
  BLOOD_ANGELS:   'BLOOD_ANGELS',    // IX Legion
  IRON_HANDS:     'IRON_HANDS',      // X Legion
  ULTRAMARINES:   'ULTRAMARINES',    // XIII Legion
  SALAMANDERS:    'SALAMANDERS',     // XVIII Legion
  RAVEN_GUARD:    'RAVEN_GUARD',     // XIX Legion
  
  // Second Founding and Later Chapters
  BLACK_TEMPLARS: 'BLACK_TEMPLARS',  // Second Founding (Imperial Fists)
  
  // Special Organizations
  GREY_KNIGHTS: 'GREY_KNIGHTS',     // Ordo Malleus
  DEATHWATCH: 'DEATHWATCH',         // Ordo Xenos
};

// Paths to chapter icons (relative to public folder in frontend)
export const CHAPTER_ICON_PATHS = {
  [CHAPTER.ULTRAMARINES]: '/icons/imperium/Ultramarines [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.BLOOD_ANGELS]: '/icons/imperium/Blood Angels [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.DARK_ANGELS]: '/icons/imperium/dark-angels.svg',
  [CHAPTER.SPACE_WOLVES]: '/icons/imperium/Space Wolves [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.IMPERIAL_FISTS]: '/icons/imperium/imperial-fists.svg',
  [CHAPTER.WHITE_SCARS]: '/icons/imperium/White Scars [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.IRON_HANDS]: '/icons/imperium/Iron Hands [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.RAVEN_GUARD]: '/icons/imperium/Raven Guard [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.SALAMANDERS]: '/icons/imperium/Salamanders [Imperium, Adeptus Astartes, Space Marines, Legion].svg',
  [CHAPTER.DEATHWATCH]: '/icons/imperium/Deathwatch [Imperium, Inquisition, Ordo Xenos, Adeptus Astartes, Space Marines, Chapter].svg',
  [CHAPTER.GREY_KNIGHTS]: '/icons/imperium/Grey Knights [Imperium, Inquisition, Ordo Malleus, Adeptus Astartes, Space Marines, Chapter].svg',
  [CHAPTER.BLACK_TEMPLARS]: '/icons/imperium/Black Templars [Imperium, Adeptus Astartes, Space Marines, Imperial Fists, Chapter].svg',
};

// Default chapter to use as fallback
export const DEFAULT_CHAPTER = CHAPTER.ULTRAMARINES;
