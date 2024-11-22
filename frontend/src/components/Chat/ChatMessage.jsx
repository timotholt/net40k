import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { SYSTEM_IDS, SPECIAL_SENDERS } from '../../config/systemIds';
import ContainerWithContextMenu from '../ContainerWithContextMenu/ContainerWithContextMenu';
import { createPlayerContextMenuItems } from '../PlayerContextMenu/PlayerContextMenu';
import styles from './ChatMessage.module.css';

export default function ChatMessage({ message, isOwnMessage }) {
  const isSpecialSender = Object.values(SYSTEM_IDS).includes(message.userUuid);
  const isGameMasterMessage = message.userUuid === SYSTEM_IDS.GAME_MASTER;
  const isNewsMessage = message.userUuid === SYSTEM_IDS.NEWS;
  const isSystemMessage = message.userUuid === SYSTEM_IDS.SYSTEM;

  const handlePlayerAction = (action, playerUuid) => {
    switch (action) {
      case 'invite':
        console.log('Chat Message: Invite player:', playerUuid);
        break;
      case 'whisper':
        console.log('Chat Message: Whisper to player:', playerUuid);
        break;
      case 'friend':
        console.log('Chat Message: Add friend:', playerUuid);
        break;
      case 'mute':
        console.log('Chat Message: Mute player:', playerUuid);
        break;
      case 'report':
        console.log('Chat Message: Report player:', playerUuid);
        break;
      case 'block':
        console.log('Chat Message: Block player:', playerUuid);
        break;
      default:
        console.log('Chat Message: Unknown action:', action, playerUuid);
    }
  };

  // Context menu items for game actions
  const gameActionContextMenuItems = message.metaData && (
    message.metaData.gameId ? [
      ...(message.metaData.inviterId ? [
        {
          label: 'Join game',
          icon: '✅',
          onClick: () => {
            console.log(`/join ${message.metaData.gameId}`);
          }
        },
        {
          label: 'Decline',
          icon: '❌',
          onClick: () => {
            console.log(`/decline ${message.metaData.gameId}`);
          }
        }
      ] : []),
      ...(message.metaData.gameId ? [
        {
          label: 'View game',
          icon: '👁️',
          onClick: () => {
            console.log(`/view ${message.metaData.gameId}`);
          }
        },
        {
          label: 'Take turn',
          icon: '▶️',
          onClick: () => {
            console.log(`/play ${message.metaData.gameId}`);
          }
        }
      ] : [])
    ] : []
  );

  // Context menu items for news links
  const newsLinkContextMenuItems = message.metaData?.url ? [
    {
      label: 'Open link',
      icon: '🔗',
      onClick: () => {
        window.open(message.metaData.url, '_blank', 'noopener,noreferrer');
      }
    }
  ] : [];

  const Username = () => (
    isSpecialSender ? (
      <span 
        className={styles.username} 
        style={{ color: SPECIAL_SENDERS[message.userUuid].color }}
      >
        {SPECIAL_SENDERS[message.userUuid].nickname}
      </span>
    ) : (
      <ContainerWithContextMenu 
        contextMenuItems={createPlayerContextMenuItems(message.userUuid, handlePlayerAction)}
        className={styles.username}
      >
        {message.nickname}
      </ContainerWithContextMenu>
    )
  );

  const MessageContent = () => (
    <div className={styles.messageContent}>
      <Username />:{' '}
      <span className={styles.messageText}>
        {message.message}
      </span>
      <span className={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );

  return (
    <motion.div
      className={`${styles.message} ${isOwnMessage ? styles.ownMessage : ''} ${
        isGameMasterMessage ? styles.gmMessage : ''} ${
        isNewsMessage && message.metaData?.url ? styles.newsMessage : ''} ${
        message.metaData?.gameId || message.metaData?.url ? styles.actionable : ''}`}
      data-system={isSystemMessage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {(message.metaData?.gameId || message.metaData?.url) && (gameActionContextMenuItems.length > 0 || newsLinkContextMenuItems.length > 0) ? (
        <ContainerWithContextMenu 
          contextMenuItems={message.metaData?.url ? newsLinkContextMenuItems : gameActionContextMenuItems}
        >
          <MessageContent />
        </ContainerWithContextMenu>
      ) : (
        <MessageContent />
      )}
    </motion.div>
  );
}