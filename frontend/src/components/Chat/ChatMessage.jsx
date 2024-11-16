import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { SYSTEM_IDS, SPECIAL_SENDERS } from '../../config/systemIds';
import ContainerWithContextMenu from '../ContainerWithContextMenu/ContainerWithContextMenu';
import { createPlayerContextMenuItems } from '../PlayerContextMenu/PlayerContextMenu';
import styles from './ChatMessage.module.css';

export default function ChatMessage({ message, isOwnMessage }) {
  const isSpecialSender = Object.values(SYSTEM_IDS).includes(message.userId);
  const isGameMasterMessage = message.userId === SYSTEM_IDS.GAME_MASTER;
  const isNewsMessage = message.userId === SYSTEM_IDS.NEWS;
  const isSystemMessage = message.userId === SYSTEM_IDS.SYSTEM;

  const handlePlayerAction = (action, playerId) => {
    switch (action) {
      case 'invite':
        console.log('Chat Message: Invite player:', playerId);
        break;
      case 'whisper':
        console.log('Chat Message: Whisper to player:', playerId);
        break;
      case 'friend':
        console.log('Chat Message: Add friend:', playerId);
        break;
      case 'mute':
        console.log('Chat Message: Mute player:', playerId);
        break;
      case 'report':
        console.log('Chat Message: Report player:', playerId);
        break;
      case 'block':
        console.log('Chat Message: Block player:', playerId);
        break;
      default:
        console.log('Chat Message: Unknown action:', action, playerId);
    }
  };

  // Context menu items for game actions
  const gameActionContextMenuItems = message.hasAction ? [
    ...(message.type === 'game_invite' ? [
      {
        label: 'Join game',
        icon: '✅',
        onClick: () => {
          console.log(`/join ${message.data.gameId}`);
        }
      },
      {
        label: 'Decline',
        icon: '❌',
        onClick: () => {
          console.log(`/decline ${message.data.gameId}`);
        }
      }
    ] : []),
    ...(message.type === 'game_turn' ? [
      {
        label: 'View game',
        icon: '👁️',
        onClick: () => {
          console.log(`/view ${message.data.gameId}`);
        }
      },
      {
        label: 'Take turn',
        icon: '▶️',
        onClick: () => {
          console.log(`/play ${message.data.gameId}`);
        }
      }
    ] : [])
  ] : [];

  // Context menu items for news links
  const newsLinkContextMenuItems = message.type === 'news_link' ? [
    {
      label: 'Open link',
      icon: '🔗',
      onClick: () => {
        window.open(message.data.url, '_blank', 'noopener,noreferrer');
      }
    }
  ] : [];

  const Username = () => (
    isSpecialSender ? (
      <span 
        className={styles.username} 
        style={{ color: SPECIAL_SENDERS[message.userId].color }}
      >
        {SPECIAL_SENDERS[message.userId].username}
      </span>
    ) : (
      <ContainerWithContextMenu 
        contextMenuItems={createPlayerContextMenuItems(message.userId, handlePlayerAction)}
        className={styles.username}
      >
        {message.username}
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
        isNewsMessage && message.hasAction ? styles.newsMessage : ''} ${
        message.hasAction ? styles.actionable : ''}`}
      data-system={isSystemMessage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {(message.hasAction && (gameActionContextMenuItems.length > 0 || newsLinkContextMenuItems.length > 0)) ? (
        <ContainerWithContextMenu 
          contextMenuItems={message.type === 'news_link' ? newsLinkContextMenuItems : gameActionContextMenuItems}
        >
          <MessageContent />
        </ContainerWithContextMenu>
      ) : (
        <MessageContent />
      )}
    </motion.div>
  );
}