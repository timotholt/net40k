import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import ContextMenu from '../ContextMenu/ContextMenu';
import styles from './TextWithContextMenu.module.css';

export default function TextWithContextMenu({
  text,
  contextMenuItems,
  className = '',
  onClick = null,
  onContextMenu = null
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate available space
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200; // Approximate menu width
    const menuHeight = 200; // Approximate menu height

    // Get click coordinates
    let x = e.clientX;
    let y = e.clientY;

    // Adjust position if menu would go off screen
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    // Call custom context menu handler if provided
    if (onContextMenu) {
      onContextMenu(e);
    }

    setContextMenu({ x, y, items: contextMenuItems });
  }, [contextMenuItems, onContextMenu]);

  const handleClick = useCallback((e) => {
    if (onClick) {
      onClick(e);
    }
  }, [onClick]);

  return (
    <>
      <span
        className={`${styles.text} ${className}`}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        {text}
      </span>

      {contextMenu && (
        <ContextMenu
          {...contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
}

TextWithContextMenu.propTypes = {
  text: PropTypes.node.isRequired,
  contextMenuItems: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.node,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['separator']),
    items: PropTypes.array
  })).isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  onContextMenu: PropTypes.func
};