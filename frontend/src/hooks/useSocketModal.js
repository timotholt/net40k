import { useEffect } from 'react';
import { useModal } from '../context/ModalContext';
import { MODAL_TYPES } from '../context/ModalContext';

export function useSocketModal(socket) {
  const { openModal, closeModal, closeAllModals } = useModal();

  useEffect(() => {
    if (!socket) return;

    // Server-triggered modal events
    socket.on('modal:open', ({ type, props }) => {
      openModal(type, props);
    });

    socket.on('modal:close', (modalId) => {
      closeModal(modalId);
    });

    socket.on('modal:closeAll', () => {
      closeAllModals();
    });

    return () => {
      socket.off('modal:open');
      socket.off('modal:close');
      socket.off('modal:closeAll');
    };
  }, [socket, openModal, closeModal, closeAllModals]);

  // Return methods that emit to server
  return {
    emitModalResponse: (modalId, data) => {
      socket.emit('modal:response', { modalId, data });
    }
  };
}