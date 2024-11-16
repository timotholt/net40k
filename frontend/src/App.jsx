import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useSound } from './context/SoundContext';
import { ZoomProvider } from './context/ZoomContext';
import { AuthProvider } from './context/AuthContext';
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
    <AuthProvider>
      <MainStatusBar />
      <ZoomProvider>
        <AttractScreen />
        <div className={styles.contentWrapper}>
          <ServerStatus />
          <div className={styles.app}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Login />} />
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
      </ZoomProvider>
    </AuthProvider>
  );
}

export default App;