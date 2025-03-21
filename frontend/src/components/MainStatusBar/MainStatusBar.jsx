import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import { useSound } from '../../context/SoundContext';
import { useStatusBarVisibility } from '../../hooks/useStatusBarVisibility';
import { useModal } from '../../context/ModalContext';
import { MODAL_TYPES } from '../../context/ModalContext';
import FPSCounter from '../FPSCounter/FPSCounter';
import { GearIcon } from '../Icons/GearIcon';
import { ArrowLeftIcon, LogoutIcon } from '../Icons/NavigationIcons';
import Tooltip from '../Tooltip/Tooltip';
import styles from './MainStatusBar.module.css';

export default function MainStatusBar() {
  const soundManager = useSound();
  const { isVisible, onMouseEnter, onMouseLeave } = useStatusBarVisibility();
  const { openModal } = useModal();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Determine current screen based on pathname
  const isLoginScreen = location.pathname === '/' || 
                        location.pathname === '/login' || 
                        location.pathname === '/register';
  const isGameScreen = location.pathname.includes('/game/');
  
  useEffect(() => {
    // Hide status bar after 1 second
    const timer = setTimeout(() => {
      onMouseLeave();
    }, 500);

    return () => clearTimeout(timer);
  }, [onMouseLeave]);

  const handleSettingsClick = () => {
    soundManager.play('click');
    openModal(MODAL_TYPES.SETTINGS);
  };
  
  // Handle leave button actions based on current screen
  const handleLeaveClick = () => {
    soundManager.play('click');
    
    if (isGameScreen) {
      // Return to lobby from game
      navigate('/lobby');
    } else {
      // Log out from anywhere else
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <div 
      className={`${styles.statusBar} ${isVisible ? styles.visible : styles.hidden}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.content}>
        <div className={styles.leftSection}>
          {/* Dynamic Leave Button with context-aware functionality */}
          <Tooltip 
            text={isGameScreen ? "Return to Lobby" : "Log Out"} 
            disabled={isLoginScreen}
            position="bottom"
          >
            <button
              className={styles.settingsButton}
              onClick={handleLeaveClick}
              onMouseEnter={() => soundManager.play('hover')}
              aria-label={isGameScreen ? "Return to Lobby" : "Log Out"}
              disabled={isLoginScreen}
              style={{ 
                opacity: isLoginScreen ? 0.4 : 0.8,
                cursor: isLoginScreen ? 'default' : 'pointer',
                pointerEvents: isLoginScreen ? 'none' : 'auto'
              }}
            >
              {isGameScreen ? (
                <ArrowLeftIcon className={styles.settingsIcon} />
              ) : (
                <LogoutIcon className={styles.settingsIcon} />
              )}
            </button>
          </Tooltip>
          <FPSCounter className={styles.fpsCounter} />
        </div>
        
        <div className={styles.centerSection}>
          {/* Status info will go here */}
        </div>

        <div className={styles.rightSection}>
          {/* Settings icon moved to the right */}
          <Tooltip text="Settings" position="bottom">
            <button
              className={styles.settingsButton}
              onClick={handleSettingsClick}
              onMouseEnter={() => soundManager.play('hover')}
              aria-label="Settings"
            >
              <GearIcon 
                className={styles.settingsIcon} 
              />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}