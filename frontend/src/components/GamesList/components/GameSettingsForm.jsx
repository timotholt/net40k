import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { PrimaryButton, SecondaryButton } from '../../Buttons';
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
      hasPassword: formData.hasPassword,
      ...(formData.password && { password: formData.password })
    };

    onSubmit(updatedGame);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.gameSettingsForm}>
      <div className={styles.formGroup}>
        <label htmlFor="name">Game Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          maxLength={50}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="description">Description (Optional)</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          maxLength={200}
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="maxPlayers">Max Players</label>
        <select
          id="maxPlayers"
          name="maxPlayers"
          value={formData.maxPlayers}
          onChange={handleChange}
        >
          {[2, 3, 4, 5, 6].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="turnLength">Turn Length</label>
        <select
          id="turnLength"
          name="turnLength"
          value={formData.turnLength}
          onChange={handleChange}
        >
          <option value={500}>500ms (Ultra Fast)</option>
          <option value={1000}>1s (Fast)</option>
          <option value={2000}>2s (Normal)</option>
          <option value={5000}>5s (Slow)</option>
          <option value={10000}>10s (Very Slow)</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label>
          <input
            type="checkbox"
            name="hasPassword"
            checked={formData.hasPassword}
            onChange={handleChange}
          />
          Password Protected
        </label>
        {formData.hasPassword && (
          <input
            type="password"
            name="password"
            placeholder="New Password"
            value={formData.password}
            onChange={handleChange}
            minLength={4}
            maxLength={20}
          />
        )}
      </div>

      <div className={styles.formActions}>
        <SecondaryButton type="button" onClick={() => window.closeModal()}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit">
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
