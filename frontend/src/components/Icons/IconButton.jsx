import React from 'react';
import PropTypes from 'prop-types';
import styles from './IconButton.module.css';

// Default placeholder icon
const DefaultIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const IconButton = ({ 
  icon: Icon = DefaultIcon, 
  onClick, 
  className = '', 
  title = '',
  disabled = false 
}) => {
  // If Icon is a string or number, render it directly
  if (typeof Icon === 'string' || typeof Icon === 'number') {
    return (
      <button 
        className={`${styles.iconButton} ${className}`}
        onClick={onClick}
        title={title}
        disabled={disabled}
      >
        {Icon}
      </button>
    );
  }

  // If Icon is a function or React component
  return (
    <button 
      className={`${styles.iconButton} ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      <Icon className={styles.icon} />
    </button>
  );
};

IconButton.propTypes = {
  icon: PropTypes.oneOfType([
    PropTypes.elementType,
    PropTypes.string,
    PropTypes.number
  ]),
  onClick: PropTypes.func,
  className: PropTypes.string,
  title: PropTypes.string,
  disabled: PropTypes.bool
};

// Set default props
IconButton.defaultProps = {
  icon: DefaultIcon
};
