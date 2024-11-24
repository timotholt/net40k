import PropTypes from 'prop-types';
import styles from '../PlayersList.module.css';

export default function PlayersListFilters({
  filter,
  onFilterChange,
  onKeyDown,
  onFocus,
  onBlur
}) {
  return (
    <div className={styles.filters}>
      <div className={styles.filterControls}>
        <div className={styles.searchWrapper}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={styles.searchIcon}
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Search players..."
            className={styles.searchInput}
            autoComplete='off'
          />
        </div>
      </div>
    </div>
  );
}

PlayersListFilters.propTypes = {
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired
};