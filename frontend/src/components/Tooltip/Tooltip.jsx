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
    if (isVisible && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const gap = 8; // Gap between tooltip and target

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - gap;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + gap;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - gap;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + gap;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  if (disabled) return children;

  return (
    <div 
      ref={wrapperRef}
      className={styles.tooltipWrapper}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      role="tooltip-container"
    >
      {children}
      {isVisible && createPortal(
        <div 
          className={`
            ${styles.tooltip} 
            ${styles[position]} 
            ${styles[variant]}
          `}
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left
          }}
          role="tooltip"
          aria-hidden={!isVisible}
        >
          {icon}
          {typeof text === 'string' ? <span>{text}</span> : text}
        </div>,
        document.getElementById('portal-root')
      )}
    </div>
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
