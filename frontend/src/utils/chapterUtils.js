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
    [CHAPTER.CRIMSON_FISTS]: 'Crimson Fists',
  };

  return Object.entries(chapterMap).map(([value, label]) => ({
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
