import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
// import { useSocket } from '../../context/SocketContext'; // Socket.io removed
import { SYSTEM_IDS } from '../../config/systemIds';
import ChatMessage from './ChatMessage';
import EmptyState from './components/EmptyState';
import styles from './Chat.module.css';
import { createMessageUuid } from 'shared/constants/GameUuids';

export default function Chat({ 
  endpoint, 
  placeholder, 
  messages: initialMessages = [], 
  type = 'default',
  onInputFocus,
  onInputBlur,
  onInputKeyDown,
  filter: initialFilter = '',
  onFilterChange
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isFilterMode, setIsFilterMode] = useState(false);
  const [filter, setFilter] = useState(initialFilter);
  const [filteredMessages, setFilteredMessages] = useState(initialMessages);
  const messagesEndRef = useRef(null);
  const user = useSelector(selectUser);
  // const socket = useSocket(); // Socket.io removed

  const isLobbyChat = endpoint.includes('lobby');
  const isWhisperChat = endpoint.includes('whisper');
  const isSpecialChat = endpoint.includes('news') || endpoint.includes('system') || endpoint.includes('games');
  const chatGame = endpoint.split('/').pop(); // Get the chat game from endpoint

  // Debugging function to selectively log messages
  const debugLog = (...args) => {
    if (!isLobbyChat) {
      console.log(...args);
    }
  };

  useEffect(() => {
    if (!isLobbyChat) {
      debugLog('Chat Endpoint:', endpoint);
      debugLog('Initial Messages Count:', initialMessages?.length);
    }
    setMessages(initialMessages || []);
  }, [endpoint, initialMessages]);

  useEffect(() => {
    if (!isLobbyChat) {
      debugLog('Filtering Messages - Endpoint:', endpoint);
      debugLog('Total Messages:', messages.length);
      debugLog('Filtered Messages:', filteredMessages.length);
    }
  }, [messages, filteredMessages, endpoint]);

  // Modify filtering logic to handle whisper and special chats
  useEffect(() => {
    let processedMessages = messages;

    // Special handling for whisper chat
    if (isWhisperChat) {
      processedMessages = messages.filter(msg => {
        // If user is not defined, fall back to a safe filtering mechanism
        if (!user) {
          debugLog('No user context - using fallback whisper filtering');
          
          // For mock messages, check if they have specific properties indicating a whisper
          const isMockWhisper = 
            msg.metaData?.isWhisper === true || 
            (msg.userUuid && msg.userUuid.startsWith('mock_whisper_'));

          debugLog('Mock Whisper Check:', {
            userUuid: msg.userUuid,
            metaData: msg.metaData,
            isMockWhisper
          });

          return isMockWhisper;
        }

        // Check if the message is a whisper or involves the current user
        const isUserInvolved = 
          msg.userUuid === user.userUuid || 
          msg.recipientUuid === user.userUuid ||
          msg.metaData?.isWhisper === true;

        debugLog('Whisper Message Check:', {
          userUuid: msg.userUuid,
          currentUserUuid: user?.userUuid,
          recipientUuid: msg.recipientUuid,
          metaData: msg.metaData,
          isUserInvolved
        });

        return isUserInvolved;
      });
    }

    // Apply text filter if exists
    if (filter) {
      const lowercaseFilter = filter.toLowerCase();
      processedMessages = processedMessages.filter(msg => 
        msg.message.toLowerCase().includes(lowercaseFilter) ||
        msg.nickname?.toLowerCase().includes(lowercaseFilter)
      );
    }

    if (!isLobbyChat) {
      debugLog('Processed Whisper Messages:', processedMessages.length);
    }

    setFilteredMessages(processedMessages);
  }, [messages, filter, isWhisperChat, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSpecialChat || isFilterMode || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    if (initialMessages) {
      const mockMessage = {
        messageUuid: createMessageUuid(),
        userUuid: user.userUuid,
        nickname: user.nickname || "You",
        message: messageContent,
        timestamp: new Date().toISOString(),
        metaData: {
          isWhisper: isWhisperChat
        }
      };
      console.log('Mock Message:', {
        messageUuid: mockMessage.messageUuid,
        userId: mockMessage.userUuid,
        message: mockMessage.message,
        timestamp: mockMessage.timestamp
      });
      setMessages(prev => [...prev, mockMessage]);
      return;
    }

    try {
      // HTTP-only implementation
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUuid: user.userUuid,
          message: messageContent,
          metaData: {
            isWhisper: isWhisperChat
          }
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      console.log('Sent Message:', {
        id: data.id,
        userId: data.userId || data.userUuid,
        message: data.message,
        timestamp: data.timestamp
      });
      setMessages(prev => [...prev, data]);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (filter) {
        e.preventDefault();
        setFilter('');
      }
    }
    if (onInputKeyDown) {
      onInputKeyDown(e);
    }
  };

  const toggleFilterMode = () => {
    if (!isSpecialChat) {
      setIsFilterMode(!isFilterMode);
      if (isFilterMode) {
        setFilter('');
      }
    }
  };

  const canFilter = isSpecialChat || isFilterMode;
  const showSendButton = !isSpecialChat && !isFilterMode;

  return (
    <div className={`${styles.chatContainer} ${styles[type]}`}>
      <div className={styles.messages}>
        {(() => {
          debugLog('Rendering Messages:', {
            totalMessages: messages.length,
            filteredMessagesLength: filteredMessages.length,
            messages: messages.map(msg => ({
              id: msg.id,
              userUuid: msg.userUuid,
              isWhisper: msg.isWhisper,
              type: msg.type,
              message: msg.message
            })),
            filteredMessages: filteredMessages.map(msg => ({
              id: msg.id,
              userUuid: msg.userUuid,
              isWhisper: msg.isWhisper,
              type: msg.type,
              message: msg.message
            }))
          });

          if (filteredMessages.length > 0) {
            return filteredMessages
              .filter(msg => {
                const hasValidMessage = msg && msg.userUuid;
                return hasValidMessage;
              })
              .map((msg, index) => (
                <ChatMessage
                  key={`${msg.id}-${index}`}
                  message={msg}
                  isOwnMessage={user && msg.userUuid === user.userUuid}
                />
              ));
          } else if (filter) {
            return <EmptyState message="No messages match your search. Press <ESC> to clear." />;
          } else {
            return null;
          }
        })()}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <div className={styles.inputControls}>
          {!isSpecialChat && (
            <button
              type="button"
              className={`${styles.filterToggle} ${isFilterMode ? styles.active : ''}`}
              onClick={toggleFilterMode}
              title="Search messages"
              tabIndex={-1}
            >
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
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          )}
          {isSpecialChat && (
            <div className={`${styles.searchWrapper} ${filter ? styles.active : ''}`}>
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
                onChange={(e) => setFilter(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={onInputFocus}
                onBlur={onInputBlur}
                placeholder="Search messages..."
                className={styles.searchInput}
                tabIndex={-1}
              />
            </div>
          )}
          {!isSpecialChat && (
            <input
              type="text"
              value={canFilter ? filter : newMessage}
              onChange={(e) => canFilter ? setFilter(e.target.value) : setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              placeholder={canFilter ? "Search messages..." : placeholder}
              className={styles.input}
              tabIndex={-1}
            />
          )}
          {showSendButton && (
            <button 
              type="submit" 
              className={styles.sendButton}
              tabIndex={-1}
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
}