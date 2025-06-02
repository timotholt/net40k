import { CHAPTER } from 'shared/constants/GameConstants';

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
