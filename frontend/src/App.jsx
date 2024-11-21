import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useSound } from './context/SoundContext';
import { ZoomProvider } from './context/ZoomContext';
import { ModalProvider, useModal, MODAL_TYPES } from './context/ModalContext';
import Modal from './components/Modal/Modal';
import ProtectedRoute from './components/ProtectedRoute';
import ServerStatus from './components/ServerStatus/ServerStatus';
import AttractScreen from './components/AttractScreen/AttractScreen';
import MainStatusBar from './components/MainStatusBar/MainStatusBar';
import SoundControls from './components/SoundControls/SoundControls';
import ContextMenuTest from './components/ContextMenuTest/ContextMenuTest';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Lobby from './pages/Lobby/Lobby';
import Game from './pages/Game/Game';
import styles from './styles/App.module.css';

// Modal Renderer Component
function ModalRenderer() {
  const { modals, closeModal } = useModal();

  return modals.map(modal => {
    switch (modal.type) {
      case MODAL_TYPES.ALERT:
        return (
          <Modal 
            key={modal.id}
            isOpen={true}
            onClose={() => closeModal(modal.id)}
            title={modal.props.title || 'Alert'}
          >
            <p>{modal.props.message}</p>
            <div className={styles.modalActionButtons}>
              <button 
                className={`${styles.modalButton} ${styles.modalButtonConfirm}`}
                onClick={() => {
                  modal.props.onConfirm?.();
                  closeModal(modal.id);
                }}
              >
                OK
              </button>
            </div>
          </Modal>
        );
      case MODAL_TYPES.CONFIRM:
        return (
          <Modal 
            key={modal.id}
            isOpen={true}
            onClose={() => closeModal(modal.id)}
            title={modal.props.title || 'Confirm Action'}
            primaryButtonText={modal.props.secondaryButtonText || 'Cancel'}
            secondaryButtonText={modal.props.primaryButtonText || 'Confirm'}
            onPrimaryButtonClick={() => {
              modal.props.onSecondaryButtonClick?.() || modal.props.onCancel?.();
              closeModal(modal.id);
            }}
            onSecondaryButtonClick={() => {
              modal.props.onPrimaryButtonClick?.() || modal.props.onConfirm?.();
              closeModal(modal.id);
            }}
          >
            <p>{modal.props.message}</p>
          </Modal>
        );
      default:
        return null;
    }
  });
}

function App() {
  const location = useLocation();
  const soundManager = useSound();

  useEffect(() => {
    soundManager.startBackgroundMusic();
  }, [soundManager]);

  useEffect(() => {
    soundManager.play('transition');
  }, [location.pathname, soundManager]);

  // Disable browser context menu globally
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <ModalProvider>
      <ZoomProvider>
        <MainStatusBar />
        <AttractScreen />
        <div className={styles.contentWrapper}>
          <ServerStatus />
          <div className={styles.app}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/lobby" element={<Lobby />} />
                  <Route path="/game/:gameId" element={<Game />} />
                </Route>
              </Routes>
            </AnimatePresence>
          </div>
        </div>
        <SoundControls />
        <ContextMenuTest />
        <ModalRenderer />
      </ZoomProvider>
    </ModalProvider>
  );
}

export default App;