import styles from '../GamesList.module.css';

export default function GameListFilters({
  filter,
  onFilterChange,
  hideFullGames,
  onHideFullGames,
  hidePasswordGames,
  onHidePasswordGames
}) {
  return (
    <div className={styles.filters}>
      <div className={styles.filterControls}>
        <input
          type="text"
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Search games..."
          className={styles.searchInput}
        />
        
        <div className={styles.checkboxes}>
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={hideFullGames}
              onChange={(e) => onHideFullGames(e.target.checked)}
            />
            Hide full games
          </label>
          
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={hidePasswordGames}
              onChange={(e) => onHidePasswordGames(e.target.checked)}
            />
            Hide locked games
          </label>
        </div>
      </div>
    </div>
  );
}