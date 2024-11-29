import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useSound } from '../../context/SoundContext';
import { useStatusBarVisibility } from '../../hooks/useStatusBarVisibility';
import { useModal } from '../../context/ModalContext';
import { MODAL_TYPES } from '../../context/ModalContext';
import FPSCounter from '../FPSCounter/FPSCounter';
import { GearIcon } from '../Icons/GearIcon';
import styles from './MainStatusBar.module.css';

export default function MainStatusBar() {
  const soundManager = useSound();
  const { isVisible, onMouseEnter, onMouseLeave } = useStatusBarVisibility();
  const { openModal } = useModal();

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

  return (
    <div 
      className={`${styles.statusBar} ${isVisible ? styles.visible : styles.hidden}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.content}>
        <div className={styles.leftSection}>
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
          <FPSCounter className={styles.fpsCounter} />
        </div>
        
        <div className={styles.centerSection}>
          {/* Status info will go here */}
        </div>

        <div className={styles.rightSection}>
          {/* Additional status indicators */}
        </div>
      </div>
    </div>
  );
}