import { motion } from 'framer-motion';
import styles from '../GamesList.module.css';

export default function GameListHeader({ tabs, activeTab, onTabClick }) {
  return (
    <div className={styles.tabs}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
          onClick={() => onTabClick(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}