import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './Modal.module.css';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  actions = [], 
  className = '',
  endpoints = [],
  onSubmit
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Handle endpoint calls
  const handleEndpointCall = useCallback(async (endpoint, method = 'POST', body = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : null
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // If onSubmit is provided, call it with the response
      if (onSubmit) {
        onSubmit(data);
      }

      return data;
    } catch (err) {
      setError(err.message);
      console.error('Modal endpoint error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [onSubmit]);

  // Prevent rendering if not open
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${className}`}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className={styles.modalContent}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {children}
        </div>

        <div className={styles.modalFooter}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={async () => {
                // If the action has an endpoint, call it
                if (action.endpoint) {
                  try {
                    await handleEndpointCall(
                      action.endpoint, 
                      action.method, 
                      action.body
                    );
                  } catch (err) {
                    // Error is already handled in handleEndpointCall
                    return;
                  }
                }

                // Call the action's onClick if provided
                if (action.onClick) {
                  action.onClick();
                }
              }}
              disabled={isLoading}
              className={action.className}
            >
              {isLoading ? 'Processing...' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  actions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func,
    endpoint: PropTypes.string,
    method: PropTypes.string,
    body: PropTypes.object,
    className: PropTypes.string
  })),
  className: PropTypes.string,
  endpoints: PropTypes.arrayOf(PropTypes.shape({
    url: PropTypes.string.isRequired,
    method: PropTypes.string,
    body: PropTypes.object
  })),
  onSubmit: PropTypes.func
};