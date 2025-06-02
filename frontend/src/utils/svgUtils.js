import { CHAPTER } from 'shared/constants/GameConstants';

// Define scaling adjustments for Space Marine class icons
const SPACE_MARINE_CLASS_ICON_STYLES = {
  commander: { scale: 1.1 },
  apothecary: { scale: 0.8 },
  chaplain: { scale: 0.9 },
  librarian: { scale: 0.9 },
  techmarine: { scale: 0.85 },
};

/**
 * Get normalized styles for Space Marine class icons
 * @param {string} className - The class name (command, apothecary, etc.)
 * @returns {Object} Style object with scaling and positioning
 */
export const getSpaceMarineClassIconStyle = (className) => {
  const adjustment = SPACE_MARINE_CLASS_ICON_STYLES[className] || { scale: 0.8 };
  
  return {
    transform: `scale(${adjustment.scale})`,
    transformOrigin: 'center',
    width: '20px',
    height: '20px',
    display: 'block',
    margin: 'auto',
    filter: 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.3))',
  };
};

// Define scaling adjustments for SVGs that need resizing
export const getNormalizedSvgStyle = (chapter) => {
  // These values might need fine-tuning based on actual rendering
  const adjustments = {
    [CHAPTER.ULTRAMARINES]: { scale: 0.6 },
    [CHAPTER.BLOOD_ANGELS]: { scale: 0.8 },
    [CHAPTER.DARK_ANGELS]: { scale: 0.8 },
    [CHAPTER.SPACE_WOLVES]: { scale: 0.9 },
    [CHAPTER.IMPERIAL_FISTS]: { scale: 0.8 },
    [CHAPTER.WHITE_SCARS]: { scale: 0.8 },
    [CHAPTER.IRON_HANDS]: { scale: 0.7 },
    [CHAPTER.RAVEN_GUARD]: { scale: 0.8 },
    [CHAPTER.SALAMANDERS]: { scale: 0.8 },
    [CHAPTER.DEATHWATCH]: { scale: 0.6 },
    [CHAPTER.GREY_KNIGHTS]: { scale: 0.8 },
    [CHAPTER.BLACK_TEMPLARS]: { scale: 0.7 },
  };

  const adjustment = adjustments[chapter] || { scale: 1 };
  
  return {
    transform: `scale(${adjustment.scale})`,
    transformOrigin: 'center',
    width: '100%',
    height: '100%',
    display: 'block',
    margin: 'auto' // Center the icon within its container
  };
};
