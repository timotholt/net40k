import { useState, useEffect } from 'react';
import styles from './Tabs.module.css';

export default function SoundTab() {
  const [volumes, setVolumes] = useState({
    master: 75,
    music: 75,
    sfx: 75,
    voice: 75
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('sound');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.volumes) {
        setVolumes(settings.volumes);
      } else {
        // Handle old format where volumes were at the root level
        setVolumes(settings);
      }
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
    ['master', 'music', 'sfx', 'voice'].forEach(type => {
      const slider = document.querySelector(`input[type="range"][data-type="${type}"]`);
      if (slider) {
        const fillPercent = (volumes[type] / slider.max) * 100;
        slider.style.setProperty('--fill-percent', `${fillPercent}%`);
      }
    });
  }, [volumes]);

  const handleSaveSettings = () => {
    localStorage.setItem('sound', JSON.stringify({
      volumes
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

            <div className={styles.volumeSlider}>
              <label>Voice Volume</label>
              <input
                type="range"
                min="0"
                max="100"
                value={volumes.voice}
                data-type="voice"
                onChange={(e) => handleVolumeChange('voice', e.target.value)}
                className={styles.volumeSliderInput}
              />
              <span>{volumes.voice}%</span>
              <button 
                onClick={() => handleVolumeChange('voice', 75)} 
                className={styles.button}
                style={{ marginLeft: '10px', padding: '0.25rem 0.5rem', fontSize: '0.9rem' }}
                title="Reset to default volume"
              >
                Reset
              </button>
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