import { useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './Modal.module.css';

export default function BaseModal({ 
  title, 
  onClose, 
  children, 
  actions,
  closeOnOverlayClick = true
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={styles.modalContent}>
          {children}
        </div>
        {actions && (
          <div className={styles.modalActions}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

BaseModal.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  closeOnOverlayClick: PropTypes.bool
};