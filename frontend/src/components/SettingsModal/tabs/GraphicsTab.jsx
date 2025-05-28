import { useState } from 'react';
import styles from './Tabs.module.css';

export default function GraphicsTab() {
  const [resolution, setResolution] = useState('800x600');
  const [scale, setScale] = useState('100');

  const handleSaveSettings = () => {
    localStorage.setItem('graphics', JSON.stringify({
      resolution,
      scale
    }));
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Display Settings</h3>
          <div className={styles.formGroup}>
            <label>Resolution</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            >
              <option value="800x600">800 x 600</option>
              <option value="1024x768">1024 x 768</option>
              <option value="1280x720">1280 x 720</option>
              <option value="1920x1080">1920 x 1080</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>UI Scale</label>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
            >
              <option value="80">80%</option>
              <option value="100">100%</option>
              <option value="120">120%</option>
              <option value="150">150%</option>
            </select>
          </div>
        </section>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <button onClick={handleSaveSettings} className={styles.button}>
            Save Changes
          </button>
          <p className={styles.note}>
            Note: Graphics settings are saved in your browser
          </p>
        </div>
      </div>
    </div>
  );
}