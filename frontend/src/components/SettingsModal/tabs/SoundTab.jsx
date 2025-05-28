import { useState, useEffect } from 'react';
import styles from './Tabs.module.css';

export default function SoundTab() {
  const [volumes, setVolumes] = useState({
    master: 75,
    music: 75,
    sfx: 75
  });

  const [notifications, setNotifications] = useState({
    playerJoinServer: true,
    playerJoinGame: true,
    lobbyMessage: true,
    gameMessage: true
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('sound');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setVolumes(settings.volumes);
      setNotifications(settings.notifications);
    }
  }, []);

  const handleVolumeChange = (type, value) => {
    setVolumes(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleNotificationChange = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleSaveSettings = () => {
    localStorage.setItem('sound', JSON.stringify({
      volumes,
      notifications
    }));
  };

  return (
    <div className={styles.tabPanel}>
      <section className={styles.section}>
        <h3>Volume Controls</h3>
        <div className={styles.volumeControls}>
          <div className={styles.volumeSlider}>
            <label>Master Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volumes.master}
              onChange={(e) => handleVolumeChange('master', e.target.value)}
            />
            <span>{volumes.master}%</span>
            <button 
              onClick={() => handleVolumeChange('master', 75)} 
              className={styles.button}
              style={{ marginLeft: '10px', padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
              title="Reset to default volume"
            >
              Reset
            </button>
          </div>

          <div className={styles.volumeSlider}>
            <label>Music Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volumes.music}
              onChange={(e) => handleVolumeChange('music', e.target.value)}
            />
            <span>{volumes.music}%</span>
            <button 
              onClick={() => handleVolumeChange('music', 75)} 
              className={styles.button}
              style={{ marginLeft: '10px', padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
              title="Reset to default volume"
            >
              Reset
            </button>
          </div>

          <div className={styles.volumeSlider}>
            <label>SFX Volume</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volumes.sfx}
              onChange={(e) => handleVolumeChange('sfx', e.target.value)}
            />
            <span>{volumes.sfx}%</span>
            <button 
              onClick={() => handleVolumeChange('sfx', 75)} 
              className={styles.button}
              style={{ marginLeft: '10px', padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
              title="Reset to default volume"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Notification Sounds</h3>
        <div className={styles.notificationSettings}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={notifications.playerJoinServer}
              onChange={() => handleNotificationChange('playerJoinServer')}
            />
            Player joins/leaves server
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={notifications.playerJoinGame}
              onChange={() => handleNotificationChange('playerJoinGame')}
            />
            Player joins/leaves game
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={notifications.lobbyMessage}
              onChange={() => handleNotificationChange('lobbyMessage')}
            />
            New lobby message
          </label>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={notifications.gameMessage}
              onChange={() => handleNotificationChange('gameMessage')}
            />
            New game message
          </label>
        </div>

        <button onClick={handleSaveSettings} className={styles.button}>
          Save Changes
        </button>

        <p className={styles.note}>
          Note: Sound settings are saved in your browser
        </p>
      </section>
    </div>
  );
}