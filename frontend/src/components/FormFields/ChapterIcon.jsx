import React from 'react';
import PropTypes from 'prop-types';
import { CHAPTER_ICON_PATHS, DEFAULT_CHAPTER } from 'shared/constants/GameConstants';
import styles from './FormFields.module.css';

/**
 * Displays a chapter icon with optional size and className
 * @param {Object} props - Component props
 * @param {string} props.chapter - Chapter key (e.g., 'ULTRAMARINES')
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md'] - Size of the icon
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline styles
 * @param {string} [props.alt] - Alt text (defaults to chapter name)
 * @returns {JSX.Element} Chapter icon component
 */
const ChapterIcon = ({
  chapter,
  size = 'md',
  className = '',
  style = {},
  alt,
  ...rest
}) => {
  const iconPath = CHAPTER_ICON_PATHS[chapter] || CHAPTER_ICON_PATHS[DEFAULT_CHAPTER];
  const altText = alt || `${chapter} Chapter`;

  return (
    <img
      src={iconPath}
      alt={altText}
      className={`${styles.chapterIcon || ''} ${styles[`icon-${size}`] || ''} ${className}`}
      style={style}
      {...rest}
    />
  );
};

ChapterIcon.propTypes = {
  chapter: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  style: PropTypes.object,
  alt: PropTypes.string,
};

export default ChapterIcon;
