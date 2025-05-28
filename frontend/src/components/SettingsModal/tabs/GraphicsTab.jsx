import { useState } from 'react';
import styles from './Tabs.module.css';
import DropdownField from '../../FormFields/DropdownField';
import Icon from '../../FormFields/Icon';

// Placeholder icon components
const ResolutionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const ScaleIcon = () => (
  <svg width="20" height="24" viewBox="0 0 28 40" fill="currentColor" stroke="none" style={{ overflow: 'visible' }}>
    <g transform="translate(0, 8)">
      <text x="2" y="26" fontSize="20" fontWeight="bold" fontFamily="sans-serif" textAnchor="start" dominantBaseline="alphabetic">A</text>
      <text x="13" y="26" fontSize="30" fontWeight="bold" fontFamily="sans-serif" textAnchor="start" dominantBaseline="alphabetic">A</text>
    </g>
  </svg>
);

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
            <DropdownField
              label="Resolution"
              name="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              leftIcon={<ResolutionIcon />}
              options={[
                { value: '800x600', label: '800 x 600' },
                { value: '1024x768', label: '1024 x 768' },
                { value: '1280x720', label: '1280 x 720' },
                { value: '1920x1080', label: '1920 x 1080' }
              ]}
              placeholder="Select resolution"
            />
          </div>

          <div className={styles.formGroup}>
            <DropdownField
              label="UI Scale"
              name="scale"
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              leftIcon={<ScaleIcon />}
              options={[
                { value: '80', label: '80%' },
                { value: '100', label: '100%' },
                { value: '120', label: '120%' },
                { value: '150', label: '150%' }
              ]}
              placeholder="Select UI scale"
            />
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