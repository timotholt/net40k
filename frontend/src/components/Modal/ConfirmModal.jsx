import React from 'react';
import PropTypes from 'prop-types';
import BaseModal from './BaseModal';
import styles from './Modal.module.css';

export default function ConfirmModal({ 
  onClose, 
  message, 
  onConfirm, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'default'
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const actionButtons = (
    <div className={styles.modalActionButtons}>
      <button 
        onClick={onClose} 
        className={`${styles.modalButton} ${styles.modalButtonCancel}`}
      >
        {cancelText}
      </button>
      <button 
        onClick={handleConfirm} 
        className={`
          ${styles.modalButton} 
          ${variant === 'destructive' ? styles.modalButtonDestructive : styles.modalButtonConfirm}
        `}
      >
        {confirmText}
      </button>
    </div>
  );

  return (
    <BaseModal 
      title="Confirm Action" 
      onClose={onClose} 
      actions={actionButtons}
    >
      <p className={styles.modalConfirmMessage}>{message}</p>
    </BaseModal>
  );
}

ConfirmModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'destructive'])
};
