import PropTypes from 'prop-types';
import ContainerWithContextMenu from '../../ContainerWithContextMenu/ContainerWithContextMenu';
import { createPlayerContextMenuItems } from '../../PlayerContextMenu/PlayerContextMenu';
import styles from './PlayerListItem.module.css';

const FriendBadgeIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    className={styles.friendBadge}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M8 15C5.79086 15 4 16.7909 4 19V21" />
    <path d="M12 8C12 10.2091 10.2091 12 8 12C5.79086 12 4 10.2091 4 8C4 5.79086 5.79086 4 8 4C10.2091 4 12 5.79086 12 8Z" />
    <path d="M19 15V21" />
    <path d="M16 18H22" />
  </svg>
);

const MutedBadgeIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    className={styles.mutedIcon}
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round" 
    strokeLinejoin="round"
    title="Player is muted"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5z" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const formatStatus = (status) => {
  switch (status) {
    case 'In Game': return 'In\u00A0Game';
    case 'In Lobby': return 'Lobby';
    default: return status;
  }
};

export default function PlayerListItem({ player, isSelected, onSelect }) {
  const handlePlayerAction = (action, playerUuid) => {
    switch (action) {
      case 'invite':
        console.log('Invite player:', playerUuid);
        break;
      case 'whisper':
        console.log('Whisper to player:', playerUuid);
        break;
      case 'friend':
        console.log('Add friend:', playerUuid);
        break;
      case 'mute':
        console.log('Mute player:', playerUuid);
        break;
      case 'report':
        console.log('Report player:', playerUuid);
        break;
      case 'block':
        console.log('Block player:', playerUuid);
        break;
      default:
        console.log('Unknown action:', action, playerUuid);
    }
  };

  const contextMenuItems = createPlayerContextMenuItems(player.userUuid, handlePlayerAction);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('PlayerListItem - handleClick:', {
      playerUuid: player.userUuid,
      isCurrentlySelected: isSelected
    });
    onSelect(player.userUuid);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('PlayerListItem - handleContextMenu:', {
      playerUuid: player.userUuid,
      isCurrentlySelected: isSelected
    });
    if (!isSelected) {
      onSelect(player.userUuid);
    }
  };

  const getConnectionStatusClass = () => {
    switch (player.connectionStatus) {
      case 'online': return `${styles.onlineStatus} ${styles.online}`;
      case 'offline': return `${styles.onlineStatus} ${styles.offline}`;
      case 'uncertain': return `${styles.onlineStatus} ${styles.unknown}`;
      default: return `${styles.onlineStatus} ${styles.unknown}`;
    }
  };

  return (
    <div 
      className={`${styles.playerItem} ${isSelected ? styles.selected : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <ContainerWithContextMenu 
        contextMenuItems={contextMenuItems}
        onContextMenu={handleContextMenu}
      >
        <div className={styles.playerContent}>
          <div className={styles.playerName}>
            <span 
              className={getConnectionStatusClass()} 
              title={player.connectionStatus}
            />
            <span className={styles.playerNameText}>
              {player.nickname}
              {player.isCurrentUser && <span className={styles.currentUser}> (You)</span>}
            </span>
            {player.isFriend && <FriendBadgeIcon />}
            {player.isMuted && <MutedBadgeIcon />}
          </div>
          <div className={styles.playerStatus}>
            {formatStatus(player.status)}
          </div>
        </div>
      </ContainerWithContextMenu>
    </div>
  );
}

PlayerListItem.propTypes = {
  player: PropTypes.shape({
    userUuid: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    isOnline: PropTypes.bool,
    isFriend: PropTypes.bool,
    isMuted: PropTypes.bool,
    isCurrentUser: PropTypes.bool
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired
};