import { useState, useCallback } from 'react';
import { InputField, IconDropdownField } from '../../FormFields';
import SharedPasswordField from '../../FormFields/SharedPasswordField';
import { GameIcon, PlayersIcon } from '../../Icons/MenuIcons';
import styles from './CreateGameTab.module.css';
import gameService from '../../../services/gameService';

export default function CreateGameTab() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    turnLength: '1',
    maxPlayers: '4',
    password: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const game = await gameService.createGame({
        name: formData.name,
        description: formData.description,
        maxPlayers: parseInt(formData.maxPlayers),
        password: formData.password
      });
      console.log('game created successfully:', game);
    } catch (err) {
      console.error('Failed to create game:', err);
      setError(
        err.message || 
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Failed to create game'
      );
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      
      // Let the parent GamesList handle the tab navigation
      const gamesContainer = document.querySelector('.gamesContainer');
      if (gamesContainer) {
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: e.shiftKey,
          bubbles: true
        });
        gamesContainer.dispatchEvent(tabEvent);
      }
    }
  }, []);

  const descriptionIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '1rem' }}>
      <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
      <path d="M2 2l7.586 7.586"></path>
      <circle cx="11" cy="11" r="2"></circle>
    </svg>
  );

  const TimerIcon = () => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="var(--color-green)" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ marginRight: '1rem' }}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  return (
    <div 
      className={styles.createGameTab}
      onKeyDown={handleKeyDown}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.grid}>
          <div className={styles.nameField}>
            <InputField
              label="Game name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              leftIcon={<GameIcon />}
              onKeyDown={handleKeyDown}
              required
            />
          </div>

          <div className={styles.playersField}>
            <IconDropdownField
              label="Players"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleChange}
              options={[
                { 
                  value: '2', 
                  label: '2',
                  icon: <div style={{ marginRight: '1rem', color: 'var(--color-green)' }}><PlayersIcon /></div>
                },
                { 
                  value: '3', 
                  label: '3',
                  icon: <div style={{ marginRight: '1rem', color: 'var(--color-green)' }}><PlayersIcon /></div>
                },
                { 
                  value: '4', 
                  label: '4',
                  icon: <div style={{ marginRight: '1rem', color: 'var(--color-green)' }}><PlayersIcon /></div>
                }
              ]}
              leftIcon={<div style={{ marginRight: '1rem', color: 'var(--color-green)' }}><PlayersIcon /></div>}
            />
          </div>

          <div className={styles.descriptionField}>
            <InputField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              leftIcon={descriptionIcon}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={styles.turnLengthField}>
            <IconDropdownField
              label="Turn Length"
              name="turnLength"
              value={formData.turnLength}
              onChange={handleChange}
              options={[
                { 
                  value: '0.5', 
                  label: '1/2 second',
                  icon: <TimerIcon />
                },
                { 
                  value: '1', 
                  label: '1 second',
                  icon: <TimerIcon />
                },
                { 
                  value: '2', 
                  label: '2 seconds',
                  icon: <TimerIcon />
                },
                { 
                  value: '3', 
                  label: '3 seconds',
                  icon: <TimerIcon />
                }
              ]}
              leftIcon={<TimerIcon />}
            />
          </div>

          <div className={styles.passwordField}>
            <SharedPasswordField
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="optional"
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={styles.submitField}>
            <button 
              type="submit" 
              className={styles.createButton}
              onKeyDown={handleKeyDown}
            >
              Create Game
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}