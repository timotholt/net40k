import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { rehydrateAuth } from './store/authSlice';
import { useSound } from './context/SoundContext';
import { ZoomProvider } from './context/ZoomContext';
import { ModalProvider, useModal, MODAL_TYPES } from './context/ModalContext';
import Modal from './components/Modal/Modal';
import SettingsModal from './components/SettingsModal/SettingsModal';
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
import './styles/portal.css';

// Modal Renderer Component
function ModalRenderer() {
  const { modals, closeModal } = useModal();

  // Render modals with proper component conversion
  const renderedModals = useMemo(() => {
    console.log('MODALRENDERER: Rendering Modals', { 
      modalCount: modals.length 
    });

    return modals.map(modal => {
      console.log('MODALRENDERER: Rendering Individual Modal', { 
        modalId: modal.id, 
        modalType: modal.type 
      });

      switch (modal.type) {
        case MODAL_TYPES.CUSTOM:
          console.log('CUSTOM Modal Props', {
            title: modal.props.title,
            childrenType: typeof modal.props.children,
            onCloseType: typeof modal.props.onClose
          });
          return (
            <Modal 
              key={modal.id}
              isOpen={true}
              onClose={() => {
                console.log('MODAL: Closing with ID', modal.id);
                closeModal(modal.id);
              }}
              title={modal.props.title || 'Custom Modal'}
              {...modal.props}
            >
              {modal.props.children}
            </Modal>
          );
        case MODAL_TYPES.ALERT:
          return (
            <Modal 
              key={modal.id}
              isOpen={true}
              onClose={() => {
                console.log('MODAL: Closing Alert with ID', modal.id);
                closeModal(modal.id);
              }}
              title={modal.props.title || 'Alert'}
            >
              <p>{modal.props.message}</p>
            </Modal>
          );
        case MODAL_TYPES.SETTINGS:
          return (
            <SettingsModal 
              key={modal.id}
              isOpen={true}
              onClose={() => {
                console.log('MODAL: Closing Settings with ID', modal.id);
                closeModal(modal.id);
              }}
              {...modal.props}
            />
          );
        default:
          console.log('Unhandled Modal Type:', modal.type);
          return null;
      }
    }).filter(Boolean); // Remove any null values
  }, [modals, closeModal]);

  return renderedModals.length > 0 ? renderedModals : null;
}

const SettingsIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="var(--color-green)" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

function App() {
  const location = useLocation();
  const soundManager = useSound();
  const dispatch = useDispatch();

  // Rehydrate auth state on initial load and when auth state changes
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    console.log('App: Initial auth state rehydration');
    
    // Wrap in try-catch to prevent uncaught errors
    try {
      const tabId = window.name || 'default';
      const storedUser = localStorage.getItem(`user_${tabId}`);
      console.log('App: Checking for stored user with tabId:', tabId);
      
      if (storedUser) {
        console.log('App: Found stored user, dispatching rehydrate');
        dispatch(rehydrateAuth());
      } else {
        console.log('App: No stored user found');
        // Explicitly set unauthenticated state
        dispatch({ type: 'auth/setUser', payload: null });
      }
    } catch (error) {
      console.error('App: Error during auth rehydration:', error);
      // Ensure we have a clean state even if there's an error
      dispatch({ type: 'auth/setUser', payload: null });
    }
  }, [dispatch]);

  // Initialize sound effects
  useEffect(() => {
    soundManager.startBackgroundMusic();
    
    // Play transition sound on route change
    const unlisten = () => {
      soundManager.play('transition');
    };
    
    // Cleanup function
    return () => {
      // Any sound cleanup if needed
    };
  }, [soundManager]);

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
        {/* <ContextMenuTest /> */}
        <ModalRenderer />
      </ZoomProvider>
    </ModalProvider>
  );
}

export default App;