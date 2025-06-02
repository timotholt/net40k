import { useState } from 'react';
import styles from './Tabs.module.css';
import IconDropdownField from '../../FormFields/IconDropdownField';



// Resolution icon component
const ResolutionIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.75rem', verticalAlign: 'middle' }}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="9" y1="21" x2="9" y2="9"></line>
  </svg>
);

// Scale icon component
const ScaleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 18" fill="#4CAF50" stroke="none" style={{ marginRight: '0.75rem', verticalAlign: 'middle' }}>
    <g>
      <text x="2" y="16" fontSize="16" fontWeight="bold" fontFamily="sans-serif" textAnchor="start" fill="#4CAF50">A</text>
      <text x="10" y="16" fontSize="20" fontWeight="bold" fontFamily="sans-serif" textAnchor="start" fill="#4CAF50">A</text>
    </g>
  </svg>
);

const RESOLUTION_OPTIONS = [
  { 
    value: '1920x1080', 
    label: '1920 x 1080 (Full HD)',
    icon: <ResolutionIcon />
  },
  { 
    value: '2560x1440', 
    label: '2560 x 1440 (QHD)',
    icon: <ResolutionIcon />
  },
  { 
    value: '3840x2160', 
    label: '3840 x 2160 (4K)',
    icon: <ResolutionIcon />
  },
  { 
    value: 'custom', 
    label: 'Custom...',
    icon: <ResolutionIcon />
  },
];

const SCALE_OPTIONS = [
  { 
    value: '100', 
    label: '100%',
    icon: <ScaleIcon />
  },
  { 
    value: '125', 
    label: '125%',
    icon: <ScaleIcon />
  },
  { 
    value: '150', 
    label: '150%',
    icon: <ScaleIcon />
  },
  { 
    value: '175', 
    label: '175%',
    icon: <ScaleIcon />
  },
  { 
    value: '200', 
    label: '200%',
    icon: <ScaleIcon />
  },
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
            <div className={styles.settingItem}>
              <label className={styles.settingLabel}>Resolution</label>
              <IconDropdownField
                name="resolution"
                value={resolution}
                onChange={handleResolutionChange}
                options={RESOLUTION_OPTIONS}
                placeholder="Select resolution..."
                className={styles.dropdownField}
              />
            </div>

            <div className={styles.settingItem}>
              <label className={styles.settingLabel}>UI Scale</label>
              <IconDropdownField
                name="scale"
                value={scale}
                onChange={handleScaleChange}
                options={SCALE_OPTIONS}
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