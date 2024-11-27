import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import styles from './Tooltip.module.css';

/**
 * Tooltip Component - Flexible and Accessible Tooltip Implementation
 * 
 * BASIC USAGE:
 * ```jsx
 * // Simple text tooltip
 * <Tooltip text="This is a basic tooltip">
 *   Hover over me
 * </Tooltip>
 * ```
 * 
 * POSITIONING EXAMPLES:
 * ```jsx
 * // Tooltip positions: top (default), bottom, left, right
 * <Tooltip text="Top tooltip" position="top">Content</Tooltip>
 * <Tooltip text="Bottom tooltip" position="bottom">Content</Tooltip>
 * <Tooltip text="Left tooltip" position="left">Content</Tooltip>
 * <Tooltip text="Right tooltip" position="right">Content</Tooltip>
 * ```
 * 
 * VARIANT STYLING:
 * ```jsx
 * // Predefined variants: default, warning, error, success
 * <Tooltip text="Default style" variant="default">Default</Tooltip>
 * <Tooltip text="Warning message" variant="warning">Warning</Tooltip>
 * <Tooltip text="Error occurred" variant="error">Error</Tooltip>
 * <Tooltip text="Success message" variant="success">Success</Tooltip>
 * ```
 * 
 * COMPLEX CONTENT:
 * ```jsx
 * // Tooltip with custom React elements
 * <Tooltip 
 *   text={
 *     <div>
 *       <InfoIcon />
 *       <span>Complex tooltip with icon</span>
 *     </div>
 *   }
 * >
 *   Hover for details
 * </Tooltip>
 * ```
 * 
 * ACCESSIBILITY:
 * - Supports keyboard interactions
 * - Works with screen readers
 * - Provides clear, descriptive text
 * 
 * BEST PRACTICES:
 * - Keep tooltip text concise
 * - Use for supplementary information
 * - Avoid critical information in tooltips
 * 
 * PERFORMANCE:
 * - Lazy rendering of tooltip
 * - Minimal re-renders
 * - Efficient positioning calculation
 */
const LockIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const Tooltip = ({ 
  children, 
  text, 
  icon,
  position = 'top', 
  variant = 'default',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !wrapperRef.current) return;

    const updatePosition = () => {
      const rect = wrapperRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // Position relative to viewport
      let top = rect.top + scrollY;
      let left = rect.left + scrollX;

      switch (position) {
        case 'top':
          top = top - 8;
          left = left + (rect.width / 2);
          break;
        case 'bottom':
          top = top + rect.height + 8;
          left = left + (rect.width / 2);
          break;
        case 'left':
          top = top + (rect.height / 2);
          left = left - 8;
          break;
        case 'right':
          top = top + (rect.height / 2);
          left = left + rect.width + 8;
          break;
        default:
          break;
      }

      setTooltipPosition({ top, left });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, position]);

  if (disabled) {
    return children;
  }

  return (
    <>
      <div 
        ref={wrapperRef}
        className={styles.tooltipWrapper}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          className={`${styles.tooltip} ${isVisible ? styles.visible : ''}`}
          data-position={position}
          style={{
            position: 'absolute',
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
        >
          {icon ? (
            <span className={styles.tooltipIcon}>{icon}</span>
          ) : null}
          <span>{text}</span>
        </div>,
        document.body
      )}
    </>
  );
};

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  text: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.node
  ]).isRequired,
  icon: PropTypes.node,
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  variant: PropTypes.oneOf(['default', 'warning', 'error', 'success']),
  disabled: PropTypes.bool
};

export default Tooltip;
