import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import styles from './ContextMenu.module.css';

export default function ContextMenu({ 
  x, 
  y, 
  items, 
  onClose,
  className = ''
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const renderItems = (menuItems) => {
    return menuItems.map((item, index) => {
      if (item.type === 'separator') {
        return <div key={index} className={styles.separator} />;
      }

      if (item.items) {
        return (
          <div key={index} className={styles.submenuItem}>
            <span>{item.label}</span>
            <div className={styles.submenu}>
              {renderItems(item.items)}
            </div>
          </div>
        );
      }

      return (
        <button
          key={index}
          className={styles.item}
          onClick={(e) => {
            e.stopPropagation();
            item.onClick?.();
            onClose();
          }}
          disabled={item.disabled}
        >
          {item.icon && <span className={styles.icon}>{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      );
    });
  };

  return createPortal(
    <div 
      ref={menuRef}
      className={`${styles.contextMenu} ${className}`}
      style={{ 
        left: x, 
        top: y,
        position: 'fixed',
        zIndex: 100000
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {renderItems(items)}
    </div>,
    document.body
  );
}

ContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.node,
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['separator']),
    items: PropTypes.array
  })).isRequired,
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string
};