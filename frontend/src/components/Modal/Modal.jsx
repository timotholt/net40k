import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { PrimaryButton, SecondaryButton } from '../Buttons';
import styles from './Modal.module.css';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  primaryButtonVariant = 'confirm',
  secondaryButtonVariant = 'cancel'
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modalContainer}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className={styles.modal}>
              <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
              </div>
              <div className={styles.content}>
                {children}
              </div>
              {(primaryButtonText || secondaryButtonText) && (
                <div className={styles.modalActionButtons}>
                  {secondaryButtonText && (
                    <SecondaryButton 
                      onClick={onSecondaryButtonClick || onClose}
                    >
                      {secondaryButtonText}
                    </SecondaryButton>
                  )}
                  {primaryButtonText && (
                    <PrimaryButton 
                      onClick={onPrimaryButtonClick}
                    >
                      {primaryButtonText}
                    </PrimaryButton>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  primaryButtonText: PropTypes.string,
  secondaryButtonText: PropTypes.string,
  onPrimaryButtonClick: PropTypes.func,
  onSecondaryButtonClick: PropTypes.func,
  primaryButtonVariant: PropTypes.oneOf(['confirm', 'destructive']),
  secondaryButtonVariant: PropTypes.oneOf(['cancel', 'destructive'])
};