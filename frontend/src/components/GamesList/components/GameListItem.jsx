import PropTypes from 'prop-types';
import styles from './GameListItem.module.css';

const LockIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={styles.lockIcon}
    title="Password protected game"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const JoinButtonTooltip = ({ game }) => {
  if (game.players.length >= game.maxPlayers) {
    return (
      <div className={styles.tooltip}>
        <svg viewBox="0 0 24 24" width="14" height="14">
          <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" />
          <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" />
        </svg>
        <span>Game is full</span>
      </div>
    );
  }
  
  if (game.isPasswordProtected) {
    return (
      <div className={styles.tooltip}>
        <svg viewBox="0 0 24 24" width="14" height="14">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" fill="none" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" fill="none" />
        </svg>
        <span>Password required</span>
      </div>
    );
  }

  return null;
};

export default function GameListItem({ game, isSelected, onSelect, onJoin, onView, onDelete }) {
  const formatTurnLength = (ms) => {
    return ms === 500 ? '500ms' : `${ms/1000}s`;
  };

  const handleClick = (e) => {
    onSelect();
  };

  const handleContextMenu = (e) => {
    onSelect(); // Select on right click too
  };

  return (
    <div 
      className={`${styles.gameItem} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <div className={styles.gameContent}>
        <div className={styles.gameHeader}>
          <div className={styles.titleRow}>
            <span className={styles.gameName}>
              {game.name}
              {game.isPasswordProtected && <LockIcon />}
            </span>
            {game.description && (
              <span className={styles.description}>{game.description}</span>
            )}
          </div>
        </div>
        
        <div className={styles.gameInfo}>
          <span className={styles.creator}>
            By: {game.createdBy.nickname}
          </span>
          <span className={styles.players}>
            Players: {game.players.length}/{game.maxPlayers}
          </span>
          <span className={styles.turns}>
            Turn {game.turns}
          </span>
          <span className={styles.turnLength}>
            {formatTurnLength(game.turnLength)}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <div className={styles.buttonWrapper}>
          <button 
            className={styles.actionButton}
            onClick={() => onJoin(game.id)}
            disabled={game.players.length >= game.maxPlayers}
          >
            Join
          </button>
          <JoinButtonTooltip game={game} />
        </div>
        <button 
          className={styles.actionButton}
          onClick={() => onView(game.id)}
        >
          View
        </button>
        {game.isYours && (
          <button 
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => onDelete(game.id)}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

GameListItem.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    createdBy: PropTypes.shape({
      id: PropTypes.string.isRequired,
      nickname: PropTypes.string.isRequired
    }).isRequired,
    players: PropTypes.array.isRequired,
    maxPlayers: PropTypes.number.isRequired,
    turns: PropTypes.number.isRequired,
    turnLength: PropTypes.number.isRequired,
    isPasswordProtected: PropTypes.bool.isRequired,
    isYours: PropTypes.bool.isRequired
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onJoin: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};