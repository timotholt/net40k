import { IconButton } from '../../Icons/IconButton';
import { 
  JoinIcon, 
  ViewIcon, 
  DeleteIcon, 
  LockIcon,
  CrownIcon,
  UserIcon
} from '../../Icons/GameIcons';
import { GearIcon } from '../../Icons/GearIcon';
import PropTypes from 'prop-types';
import Tooltip from '../../Tooltip/Tooltip';
import styles from './GameListItem.module.css';

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

  const getJoinTooltipText = () => {
    if (game.players.length >= game.maxPlayers) {
      return "Game is full";
    }
    
    if (game.hasPassword) {
      return "Password required";
    }

    return "Join Game";
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
              {game.isYours && (
                <Tooltip text="You created this game">
                  <CrownIcon className={styles.roleIcon} />
                </Tooltip>
              )}
              {!game.isYours && game.isJoined && (
                <Tooltip text="You're playing in this game">
                  <UserIcon className={styles.roleIcon} />
                </Tooltip>
              )}
              {game.hasPassword && <LockIcon className={styles.roleIcon} />}
            </div>
            {game.description && (
              <div className={styles.description}>{game.description}</div>
            )}
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
          {/* <Tooltip 
            text={getJoinTooltipText()}
            icon={game.hasPassword ? <LockIcon /> : null}
            position="top"
          > */}
            <IconButton 
              icon={JoinIcon}
              onClick={() => onJoin(game.gameUuid)}
              disabled={game.players.length >= game.maxPlayers}
              title={getJoinTooltipText()}
            />
          {/* </Tooltip> */}

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