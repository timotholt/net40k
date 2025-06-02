import { CHAPTER } from 'shared/constants/GameConstants';

/**
 * Get all available chapters with their display names and icons
 * @returns {Array} Array of chapter objects with value, label, and icon
 */
export const getChapterOptions = () => {
  const chapterMap = {
    [CHAPTER.ULTRAMARINES]: 'Ultramarines',
    [CHAPTER.BLOOD_ANGELS]: 'Blood Angels',
    [CHAPTER.DARK_ANGELS]: 'Dark Angels',
    [CHAPTER.SPACE_WOLVES]: 'Space Wolves',
    [CHAPTER.IMPERIAL_FISTS]: 'Imperial Fists',
    [CHAPTER.WHITE_SCARS]: 'White Scars',
    [CHAPTER.IRON_HANDS]: 'Iron Hands',
    [CHAPTER.RAVEN_GUARD]: 'Raven Guard',
    [CHAPTER.SALAMANDERS]: 'Salamanders',
    [CHAPTER.DEATHWATCH]: 'Deathwatch',
    [CHAPTER.GREY_KNIGHTS]: 'Grey Knights',
    [CHAPTER.BLACK_TEMPLARS]: 'Black Templars',
  };

  // Sort chapters alphabetically, but keep Ultramarines first
  const sortedChapters = Object.entries(chapterMap)
    .sort((a, b) => {
      // Keep Ultramarines at the top
      if (a[0] === CHAPTER.ULTRAMARINES) return -1;
      if (b[0] === CHAPTER.ULTRAMARINES) return 1;
      // Sort the rest alphabetically
      return a[1].localeCompare(b[1]);
    });

  return sortedChapters.map(([value, label]) => ({
    value,
    label: `  ${label}`, // Reduced spaces before label
    icon: {
      type: 'chapter',
      value,
      size: 'sm',
      style: { 
        marginRight: '0.75rem', // Reduced from 1rem
        marginLeft: '0.25rem'   // Reduced left margin
      }
    }
  }));
};

/**
 * Get the display name for a chapter
 * @param {string} chapter - Chapter constant
 * @returns {string} Display name for the chapter
 */
export const getChapterName = (chapter) => {
  const options = getChapterOptions();
  const found = options.find(opt => opt.value === chapter);
  return found ? found.label : 'Unknown Chapter';
};
