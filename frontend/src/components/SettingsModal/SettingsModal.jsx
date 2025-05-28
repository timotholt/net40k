import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import PasswordTab from './tabs/PasswordTab';
import AccountTab from './tabs/AccountTab';
import SecurityTab from './tabs/SecurityTab';
import ProfileTab from './tabs/ProfileTab';
import GraphicsTab from './tabs/GraphicsTab';
import SoundTab from './tabs/SoundTab';
import styles from './SettingsModal.module.css';

export default function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('account');
  const user = useSelector(selectUser);

  const tabs = [
    { id: 'account', label: 'Account' },
    { id: 'password', label: 'Password' },
    { id: 'security', label: 'Security' },
    { id: 'profile', label: 'Profile' },
    { id: 'graphics', label: 'Graphics' },
    { id: 'sound', label: 'Sound' }
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
            <h2>Settings</h2>
            <button onClick={onClose} className={styles.closeButton}>×</button>
          </div>

          <div className={styles.content}>
            <div className={styles.tabs}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
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