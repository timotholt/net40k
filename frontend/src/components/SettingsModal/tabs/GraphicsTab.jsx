import { useState } from 'react';
import styles from './Tabs.module.css';
import IconDropdownField from '../../FormFields/IconDropdownField';

// Placeholder icon components
const ResolutionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

const ScaleIcon = () => (
  <svg width="18" height="24" viewBox="0 0 25 40" fill="currentColor" stroke="none" style={{ overflow: 'visible' }}>
    <g transform="translate(-4, 8)">
      <text x="0" y="26" fontSize="20" fontWeight="bold" fontFamily="sans-serif" textAnchor="start" dominantBaseline="alphabetic">A</text>
      <text x="14" y="26" fontSize="30" fontWeight="bold" fontFamily="sans-serif" textAnchor="start" dominantBaseline="alphabetic">A</text>
    </g>
  </svg>
);

const RESOLUTION_OPTIONS = [
  { value: '800x600', label: '800 x 600' },
  { value: '1024x768', label: '1024 x 768' },
  { value: '1280x720', label: '1280 x 720 (HD)' },
  { value: '1366x768', label: '1366 x 768' },
  { value: '1600x900', label: '1600 x 900 (HD+)' },
  { value: '1920x1080', label: '1920 x 1080 (Full HD)' },
  { value: '2560x1440', label: '2560 x 1440 (QHD)' },
  { value: '3840x2160', label: '3840 x 2160 (4K)' },
];

const SCALE_OPTIONS = [
  { value: '75', label: '75%' },
  { value: '100', label: '100%' },
  { value: '125', label: '125%' },
  { value: '150', label: '150%' },
  { value: '175', label: '175%' },
  { value: '200', label: '200%' },
];

export default function GraphicsTab() {
  const [resolution, setResolution] = useState('1920x1080');
  const [scale, setScale] = useState('100');

  const handleResolutionChange = (e) => {
    setResolution(e.target.value);
  };

  const handleScaleChange = (e) => {
    setScale(e.target.value);
  };

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
          <div className={styles.settingGroup}>
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <ResolutionIcon />
                <span>Resolution</span>
              </div>
              <IconDropdownField
                name="resolution"
                value={resolution}
                onChange={handleResolutionChange}
                options={RESOLUTION_OPTIONS}
                icon={<ResolutionIcon />}
                placeholder="Select resolution..."
                className={styles.dropdownField}
              />
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <ScaleIcon />
                <span>UI Scale</span>
              </div>
              <IconDropdownField
                name="scale"
                value={scale}
                onChange={handleScaleChange}
                options={SCALE_OPTIONS}
                icon={<ScaleIcon />}
                placeholder="Select scale..."
                className={styles.dropdownField}
              />
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
            Note: Graphics settings are saved in your browser
          </p>
        </div>
      </div>
    </div>
  );
}