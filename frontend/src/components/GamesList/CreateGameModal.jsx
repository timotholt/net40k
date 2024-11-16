import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InputField } from '../../components/FormFields';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import SharedPasswordField from '../../components/FormFields/SharedPasswordField';
import styles from './CreateGameModal.module.css';

export default function CreateGameModal({ mode = 'create', gameData = null, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: gameData?.name || '',
    description: gameData?.description || '',
    maxPlayers: gameData?.maxPlayers || '4',
    password: gameData?.password || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const copyGameInfo = () => {
    const info = `Game: ${formData.name}\nPassword: ${formData.password}`;
    copyToClipboard(info);
  };

  const gameIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(-90deg)' }}>
      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
      <path d="M2 2l7.586 7.586"></path>
      <circle cx="11" cy="11" r="2"></circle>
    </svg>
  );

  const descriptionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10"></line>
      <line x1="21" y1="6" x2="3" y2="6"></line>
      <line x1="21" y1="14" x2="3" y2="14"></line>
      <line x1="17" y1="18" x2="3" y2="18"></line>
    </svg>
  );

  const playersIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className={styles.modal}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className={styles.header}>
            <h2>{mode === 'create' ? 'Create New Game' : 'Change Game Settings'}</h2>
            <button
              className={styles.clipboardButton}
              onClick={copyGameInfo}
              title="Copy game name and password"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ transform: 'translateY(0.1rem)' }}
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <InputField
              label="Game name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              leftIcon={gameIcon}
              required
            />

            <InputField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              leftIcon={descriptionIcon}
            />

            <div className={styles.formGroup}>
              <label>Maximum Players</label>
              <div className={styles.inputWrapper}>
                {playersIcon}
                <select
                  name="maxPlayers"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  className={styles.select}
                  required
                >
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
            </div>

            <SharedPasswordField
              label="Game Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="optional"
            />

            <div className={styles.buttons}>
              <PrimaryButton type="submit">
                {mode === 'create' ? 'Create' : 'Update'}
              </PrimaryButton>
              <SecondaryButton onClick={onClose}>
                Cancel
              </SecondaryButton>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}