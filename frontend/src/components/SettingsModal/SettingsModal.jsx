import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, AnimateSharedLayout } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import { GearIcon } from '../Icons/GearIcon';
import PasswordTab from './tabs/PasswordTab';
import AccountTab from './tabs/AccountTab';
import SecurityTab from './tabs/SecurityTab';
import ProfileTab from './tabs/ProfileTab';
import GraphicsTab from './tabs/GraphicsTab';
import SoundTab from './tabs/SoundTab';
import EffectsTab from './tabs/EffectsTab';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('account');
  const [tabPositions, setTabPositions] = useState({});
  const tabsRef = useRef({});
  const user = useSelector(selectUser);

  useEffect(() => {
    // Update tab positions when active tab changes
    const positions = {};
    Object.entries(tabsRef.current).forEach(([id, element]) => {
      if (element) {
        positions[id] = {
          width: element.offsetWidth,
          left: element.offsetLeft
        };
      }
    });
    setTabPositions(positions);
  }, [activeTab]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', group: 'left' },
    { id: 'account', label: 'Account', group: 'left' },
    { id: 'password', label: 'Password', group: 'left' },
    { id: 'security', label: 'Security', group: 'left' },
    { id: 'spacer', label: '', group: 'spacer' },
    { id: 'graphics', label: 'Graphics', group: 'right' },
    { id: 'sound', label: 'Sound', group: 'right' },
    { id: 'effects', label: 'Effects', group: 'right' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountTab userId={user.id} />;
      case 'password':
        return <PasswordTab userId={user.id} />;
      case 'security':
        return <SecurityTab userId={user.id} />;
      case 'profile':
        return <ProfileTab userId={user.id} />;
      case 'graphics':
        return <GraphicsTab />;
      case 'sound':
        return <SoundTab />;
      case 'effects':
        return <EffectsTab />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2>
              <GearIcon 
                className={styles.gearIcon}
                width={20}
                height={20}
              />
              Settings
            </h2>
            <button onClick={onClose} className={styles.closeButton}>×</button>
          </div>

          <div className={styles.content}>
            <div className={styles.tabs}>
            <div className={styles.tabsLeft}>
              {tabs
                .filter(tab => tab.group === 'left')
                .map(tab => (
                  <div key={tab.id} className={styles.tabContainer}>
                    <button
                      ref={el => tabsRef.current[tab.id] = el}
                      className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div 
                          className={styles.activeIndicator}
                          layoutId="activeTab"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 50,
                            mass: 0.5,
                            restDelta: 0.01,
                            restSpeed: 10
                          }}
                        />
                      )}
                    </button>
                  </div>
                ))}
            </div>
            <div className={styles.tabsRight}>
              {tabs
                .filter(tab => tab.group === 'right')
                .map(tab => (
                  <div key={tab.id} className={styles.tabContainer}>
                    <button
                      ref={el => tabsRef.current[tab.id] = el}
                      className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                      onClick={() => handleTabClick(tab.id)}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div 
                          className={styles.activeIndicator}
                          layoutId="activeTab"
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 50,
                            mass: 0.5,
                            restDelta: 0.01,
                            restSpeed: 10
                          }}
                        />
                      )}
                    </button>
                  </div>
                ))}
            </div>
          </div>

            <div className={styles.tabContent}>
              {renderTabContent()}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}