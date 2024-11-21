import React from 'react';
import { useModal, MODAL_TYPES } from '../../context/ModalContext';
import Modal from './Modal';
import PropTypes from 'prop-types';

// Confirmation Modal Component
const ConfirmModal = ({ 
  title, 
  message, 
  onPrimaryButtonClick, 
  onSecondaryButtonClick, 
  primaryButtonText = 'Confirm', 
  secondaryButtonText = 'Cancel' 
}) => {
  const { closeModal } = useModal();

  const handlePrimaryClick = () => {
    onPrimaryButtonClick && onPrimaryButtonClick();
    closeModal();
  };

  const handleSecondaryClick = () => {
    onSecondaryButtonClick && onSecondaryButtonClick();
    closeModal();
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={() => closeModal()}
      title={title}
    >
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p>{message}</p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '1rem', 
          marginTop: '1rem' 
        }}>
          <button 
            onClick={handleSecondaryClick} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#f0f0f0', 
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {secondaryButtonText}
          </button>
          <button 
            onClick={handlePrimaryClick} 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#ff4d4d', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {primaryButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmModal.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  onPrimaryButtonClick: PropTypes.func,
  onSecondaryButtonClick: PropTypes.func,
  primaryButtonText: PropTypes.string,
  secondaryButtonText: PropTypes.string
};

// Alert Modal Component
const AlertModal = ({ title, message }) => {
  const { closeModal } = useModal();

  return (
    <Modal 
      isOpen={true} 
      onClose={() => closeModal()}
      title={title}
    >
      <div style={{ textAlign: 'center', padding: '1rem' }}>
        <p>{message}</p>
        <button 
          onClick={() => closeModal()} 
          style={{ 
            marginTop: '1rem', 
            padding: '0.5rem 1rem', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none',
            borderRadius: '4px'
          }}
        >
          OK
        </button>
      </div>
    </Modal>
  );
};

AlertModal.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired
};

// Modal Renderer Component
export default function ModalRenderer() {
  const { modals, closeModal } = useModal();

  if (modals.length === 0) return null;

  return modals.map(modal => {
    switch (modal.type) {
      case MODAL_TYPES.CONFIRM:
        return (
          <ConfirmModal 
            key={modal.id}
            {...modal.props}
          />
        );
      case MODAL_TYPES.ALERT:
        return (
          <AlertModal 
            key={modal.id}
            {...modal.props}
          />
        );
      case MODAL_TYPES.CUSTOM:
        return (
          <Modal 
            key={modal.id}
            isOpen={true}
            onClose={() => closeModal(modal.id)}
            {...modal.props}
          />
        );
      default:
        return null;
    }
  });
}
