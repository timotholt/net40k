import { IconButton } from '../../Icons/IconButton';
import { 
  JoinIcon, 
  ViewIcon, 
  DeleteIcon, 
  LockIcon 
} from '../../Icons/GameIcons';
import { GearIcon } from '../../Icons/GearIcon';
import PropTypes from 'prop-types';
import styles from './GameListItem.module.css';

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
  
  if (game.hasPassword) {
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

export default function GameListItem({ game, isSelected, onSelect, onJoin, onView, onDelete, onGameSettings }) {
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
            <div className={styles.gameName}>
              {game.name}
            </div>
            {game.description && (
              <div className={styles.description}>{game.description}</div>
            )}
            {game.isPasswordProtected && <LockIcon />}
          </div>
        </div>
        
        <div className={styles.gameInfo}>
          <span className={styles.creator}>
            By: {game.creatorNickname}
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
          <IconButton 
            icon={JoinIcon}
            onClick={() => onJoin(game.gameUuid)}
            disabled={game.players.length >= game.maxPlayers}
            title="Join Game"
          />
          <JoinButtonTooltip game={game} />
          <IconButton 
            icon={ViewIcon}
            onClick={() => onView(game.gameUuid)}
            title="View Game"
          />
          {game.isYours && (
            <>
              <IconButton 
                icon={GearIcon}
                onClick={() => onGameSettings(game.gameUuid)}
                title="Game Settings"
              />
              <IconButton 
                icon={DeleteIcon}
                onClick={() => onDelete(game.gameUuid)}
                title="Delete Game"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

GameListItem.propTypes = {
  game: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    creatorUuid: PropTypes.string.isRequired,
    creatorNickname: PropTypes.string.isRequired,
    players: PropTypes.array.isRequired,
    maxPlayers: PropTypes.number.isRequired,
    turns: PropTypes.number.isRequired,
    turnLength: PropTypes.number.isRequired,
    hasPassword: PropTypes.bool.isRequired,
    isYours: PropTypes.bool.isRequired,
    gameUuid: PropTypes.string.isRequired
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onJoin: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGameSettings: PropTypes.func,
};