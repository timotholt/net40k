import { motion } from 'framer-motion';
import { useSound } from '../../context/SoundContext';
import { useNavbarVisibility } from '../../hooks/useNavbarVisibility';
import { useModal } from '../../context/ModalContext';
import { MODAL_TYPES } from '../../context/ModalContext';
import FPSCounter from '../FPSCounter/FPSCounter';
import styles from './Navbar.module.css';

export default function Navbar() {
  const soundManager = useSound();
  const { isVisible, onMouseEnter, onMouseLeave } = useNavbarVisibility();
  const { openModal } = useModal();

  const handleSettingsClick = () => {
    soundManager.play('click');
    openModal(MODAL_TYPES.SETTINGS);
  };

  return (
    <motion.nav 
      className={`${styles.navbar} ${isVisible ? styles.visible : styles.hidden}`}
      animate={{ 
        y: isVisible ? 0 : '-85%',
        opacity: isVisible ? 1 : 0.4
      }}
      transition={{ 
        duration: 0.6,
        ease: "easeInOut",
        opacity: { duration: 0.8 }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={styles.navContent}>
        <div className={styles.leftSection}>
          <button
            className={styles.settingsButton}
            onClick={handleSettingsClick}
            onMouseEnter={() => soundManager.play('hover')}
            aria-label="Settings"
          >
            ⚙️
          </button>
          <FPSCounter className={styles.fpsCounter} />
        </div>
        
        <div className={styles.centerSection}>
          {/* Game status info will go here */}
        </div>

        <div className={styles.rightSection}>
          {/* Game controls will go here */}
        </div>
      </div>
    </motion.nav>
  );
}