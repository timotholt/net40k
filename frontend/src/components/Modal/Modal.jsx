import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import styles from './Modal.module.css';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '' 
}) {
  const firstRenderRef = useRef(true);
  const modalRef = useRef(null);

  // Log only on first render
  if (firstRenderRef.current) {
    console.log('MODAL: First Render', { 
      isOpen, 
      title, 
      childrenType: typeof children, 
      onCloseType: typeof onClose 
    });
    firstRenderRef.current = false;
  }

  // Handle escape key and outside click
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        console.log('MODAL: Escape key pressed');
        onClose();
      }
    };

    const handleOutsideClick = (e) => {
      if (
        isOpen && 
        modalRef.current && 
        !modalRef.current.contains(e.target)
      ) {
        console.log('MODAL: Outside click detected');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Prevent rendering if not open
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className={styles.modalOverlay}>
        <motion.div
          ref={modalRef}
          className={`${styles.modal} ${className}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <div className={styles.modalHeader}>
            <h2>{title}</h2>
            <button 
              className={styles.closeButton} 
              onClick={() => {
                console.log('MODAL: Close button clicked');
                onClose();
              }}
            >
              ✕
            </button>
          </div>
          <div className={styles.modalContent}>
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};