import { useState, useEffect, useRef } from 'react';
import styles from './Tabs.module.css';

export default function SoundTab() {
  const [volumes, setVolumes] = useState({
    master: 75,
    music: 75,
    sfx: 75
  });

  const [notifications, setNotifications] = useState({
    // Left column
    lobbyMessage: true,
    whisperMessage: true,
    gameMasterMessage: true,
    serverNewsMessage: true,
    
    // Center column
    playerJoinServer: true,
    playerJoinGame: true,
    playerEmoteSounds: true,
    
    // Right column
    friendJoinServer: true,
    friendJoinGame: true,
    friendEmoteSounds: true,
    
    // Future use placeholders
    futureUse1: false,
    futureUse2: false
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
    
    // Update the fill percentage for the slider
    const slider = document.querySelector(`input[type="range"][data-type="${type}"]`);
    if (slider) {
      const fillPercent = (value / slider.max) * 100;
      slider.style.setProperty('--fill-percent', `${fillPercent}%`);
    }
  };
  
  // Initialize slider fill on mount and when volumes change
  useEffect(() => {
    ['master', 'music', 'sfx'].forEach(type => {
      const slider = document.querySelector(`input[type="range"][data-type="${type}"]`);
      if (slider) {
        const fillPercent = (volumes[type] / slider.max) * 100;
        slider.style.setProperty('--fill-percent', `${fillPercent}%`);
      }
    });
  }, [volumes]);

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
      <div className={styles.content}>
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
                data-type="master"
                onChange={(e) => handleVolumeChange('master', e.target.value)}
                className={styles.volumeSliderInput}
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
                data-type="music"
                onChange={(e) => handleVolumeChange('music', e.target.value)}
                className={styles.volumeSliderInput}
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
                data-type="sfx"
                onChange={(e) => handleVolumeChange('sfx', e.target.value)}
                className={styles.volumeSliderInput}
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
          <div className={styles.notificationGrid}>
            {/* Left Column */}
            <div className={styles.notificationColumn}>
              <h4>New Messages</h4>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.lobbyMessage}
                  onChange={() => handleNotificationChange('lobbyMessage')}
                />
                Lobby
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.whisperMessage}
                  onChange={() => handleNotificationChange('whisperMessage')}
                />
                Whisper
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.gameMasterMessage}
                  onChange={() => handleNotificationChange('gameMasterMessage')}
                />
                Game master
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.serverNewsMessage}
                  onChange={() => handleNotificationChange('serverNewsMessage')}
                />
                Server / News
              </label>
            </div>

            {/* Center Column */}
            <div className={styles.notificationColumn}>
              <h4>Player ...</h4>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.playerJoinServer}
                  onChange={() => handleNotificationChange('playerJoinServer')}
                />
                Join / leave server
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.playerJoinGame}
                  onChange={() => handleNotificationChange('playerJoinGame')}
                />
                Join / leave game
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.playerEmoteSounds}
                  onChange={() => handleNotificationChange('playerEmoteSounds')}
                />
                Emote Sounds
              </label>
              <div className={styles.futureUse}>(future use)</div>
            </div>

            {/* Right Column */}
            <div className={styles.notificationColumn}>
              <h4>Friend ...</h4>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.friendJoinServer}
                  onChange={() => handleNotificationChange('friendJoinServer')}
                />
                Join / leave server
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.friendJoinGame}
                  onChange={() => handleNotificationChange('friendJoinGame')}
                />
                Join / leave game
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.friendEmoteSounds}
                  onChange={() => handleNotificationChange('friendEmoteSounds')}
                />
                Emote Sounds
              </label>
              <div className={styles.futureUse}>(future use)</div>
            </div>
          </div>
        </section>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <button onClick={handleSaveSettings} className={styles.button}>
            Save Changes
          </button>
          <p className={styles.note}>
            Note: Sound settings are saved in your browser
          </p>
        </div>
      </div>
    </div>
  );
}