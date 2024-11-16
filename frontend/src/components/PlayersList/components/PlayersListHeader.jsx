import PropTypes from 'prop-types';
import styles from '../PlayersList.module.css';

export default function PlayersListHeader({ tabs, activeTab, onTabClick }) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
          onClick={() => onTabClick(tab.id)}
          tabIndex={-1}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

PlayersListHeader.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabClick: PropTypes.func.isRequired
};