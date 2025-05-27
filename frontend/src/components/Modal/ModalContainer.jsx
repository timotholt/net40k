import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../../context/ModalContext';
import { MODAL_TYPES } from '../../context/ModalContext';
import GameCreateModal from './GameCreateModal';
import PasswordPromptModal from './PasswordPromptModal';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';
import SettingsModal from '../SettingsModal/SettingsModal';
import styles from './Modal.module.css';

const MODAL_COMPONENTS = {
  [MODAL_TYPES.GAME_CREATE]: GameCreateModal,
  [MODAL_TYPES.PASSWORD_PROMPT]: PasswordPromptModal,
  [MODAL_TYPES.ALERT]: AlertModal,
  [MODAL_TYPES.CONFIRM]: ConfirmModal,
  [MODAL_TYPES.SETTINGS]: SettingsModal
};

export default function ModalContainer() {
  const { modals, closeModal } = useModal();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modals.length > 0) {
        closeModal(modals[modals.length - 1].id);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [modals, closeModal]);

  if (modals.length === 0) return null;

  return createPortal(
    <div className={styles.modalOverlay}>
      {modals.map(({ id, type, props }) => {
        const ModalComponent = MODAL_COMPONENTS[type];
        if (!ModalComponent) return null;

        return (
          <ModalComponent
            key={id}
            onClose={() => closeModal(id)}
            {...props}
          />
        );
      })}
    </div>,
    document.getElementById('portal-root')
  );
}