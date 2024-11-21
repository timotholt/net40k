import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton, SecondaryButton } from '../../Buttons';
import { InputField, SharedPasswordField } from '../../FormFields';
import styles from './GameSettingsForm.module.css';

export default function GameSettingsForm({ initialGame, onSubmit }) {
  const [formData, setFormData] = useState({
    name: initialGame.name,
    description: initialGame.description || '',
    maxPlayers: initialGame.maxPlayers,
    turnLength: initialGame.turnLength,
    hasPassword: initialGame.hasPassword,
    password: '' // Only used when setting/changing password
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form data
    const updatedGame = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      maxPlayers: parseInt(formData.maxPlayers, 10),
      turnLength: parseInt(formData.turnLength, 10),
      hasPassword: !!formData.password,
      ...(formData.password && { password: formData.password })
    };

    onSubmit(updatedGame);
  };

  const gameNameIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  );

  const descriptionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
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

  const turnLengthIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className={styles.gameSettingsForm}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Game Name</label>
        <InputField
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={50}
          leftIcon={gameNameIcon}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description</label>
        <InputField
          type="textarea"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          maxLength={200}
          leftIcon={descriptionIcon}
          className={styles.input}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="maxPlayers">Max Players</label>
        <div className={`${styles.inputWrapper} ${styles.selectWrapper}`}>
          <div className={styles.iconWrapper}>
            {playersIcon}
          </div>
          <select
            id="maxPlayers"
            name="maxPlayers"
            value={formData.maxPlayers}
            onChange={handleChange}
            className={`${styles.input} ${styles.select}`}
          >
            {[2, 3, 4, 5, 6].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="turnLength">Turn Length</label>
        <div className={`${styles.inputWrapper} ${styles.selectWrapper}`}>
          <div className={styles.iconWrapper}>
            {turnLengthIcon}
          </div>
          <select
            id="turnLength"
            name="turnLength"
            value={formData.turnLength}
            onChange={handleChange}
            className={`${styles.input} ${styles.select}`}
          >
            <option value={500}>500ms (Ultra Fast)</option>
            <option value={1000}>1s (Fast)</option>
            <option value={2000}>2s (Normal)</option>
            <option value={5000}>5s (Slow)</option>
            <option value={10000}>10s (Very Slow)</option>
          </select>
        </div>
      </div>

      <div className={styles.formGroup}>
        <div className={styles.formGroupLabel}>Password</div>
        <SharedPasswordField
          name="password"
          value={formData.password}
          onChange={handleChange}
          mode="copy"
        />
      </div>

      <div className={styles.formActions}>
        <SecondaryButton 
          type="button" 
          onClick={() => window.closeModal()} 
          className={styles.cancelButton}
        >
          Cancel
        </SecondaryButton>
        <PrimaryButton 
          type="submit" 
          className={styles.createButton}
        >
          Save Changes
        </PrimaryButton>
      </div>
    </form>
  );
}

GameSettingsForm.propTypes = {
  initialGame: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    maxPlayers: PropTypes.number.isRequired,
    turnLength: PropTypes.number.isRequired,
    hasPassword: PropTypes.bool.isRequired
  }).isRequired,
  onSubmit: PropTypes.func.isRequired
};
