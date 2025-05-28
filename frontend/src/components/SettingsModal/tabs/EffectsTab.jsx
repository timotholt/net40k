import { useState, useEffect } from 'react';
import styles from './Tabs.module.css';

export default function EffectsTab() {
  const [notifications, setNotifications] = useState({
    // Left column
    lobbyMessage: true,
    whisperMessage: true,
    gameMasterMessage: true,
    serverNewsMessage: true,
    
    // Center column
    playersJoinServer: true,
    playersJoinGame: true,
    playersEmoteSounds: true,
    
    // Right column
    friendsJoinServer: true,
    friendsJoinGame: true,
    friendsEmoteSounds: true,
    
    // Future use placeholders
    futureUse1: false,
    futureUse2: false
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('effects');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setNotifications(settings.notifications || settings); // Handle both old and new formats
    }
  }, []);

  const handleNotificationChange = (type) => {
    const newNotifications = {
      ...notifications,
      [type]: !notifications[type]
    };
    setNotifications(newNotifications);
  };

  const handleSaveSettings = () => {
    localStorage.setItem('effects', JSON.stringify({
      notifications
    }));
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Notification Settings</h3>
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
              <h4>Players ...</h4>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.playersJoinServer}
                  onChange={() => handleNotificationChange('playersJoinServer')}
                />
                Join / leave server
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.playersJoinGame}
                  onChange={() => handleNotificationChange('playersJoinGame')}
                />
                Join / leave game
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.playersEmoteSounds}
                  onChange={() => handleNotificationChange('playersEmoteSounds')}
                />
                Emote Sounds
              </label>
              <div className={styles.futureUse}>(future use)</div>
            </div>

            {/* Right Column */}
            <div className={styles.notificationColumn}>
              <h4>Friends ...</h4>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.friendsJoinServer}
                  onChange={() => handleNotificationChange('friendsJoinServer')}
                />
                Join / leave server
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.friendsJoinGame}
                  onChange={() => handleNotificationChange('friendsJoinGame')}
                />
                Join / leave game
              </label>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={notifications.friendsEmoteSounds}
                  onChange={() => handleNotificationChange('friendsEmoteSounds')}
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
            Note: Effects settings are saved in your browser
          </p>
        </div>
      </div>
    </div>
  );
}
