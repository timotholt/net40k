import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
// import { useSocket } from '../../context/SocketContext'; // Socket.io removed
import { SYSTEM_IDS } from '../../config/systemIds';
import ChatMessage from './ChatMessage';
import EmptyState from './components/EmptyState';
import styles from './Chat.module.css';

export default function Chat({ 
  endpoint, 
  placeholder, 
  messages: initialMessages, 
  type = 'default',
  onInputFocus,
  onInputBlur,
  onInputKeyDown,
  filter,
  onFilterChange
}) {
  const [messages, setMessages] = useState(initialMessages || []);
  const [newMessage, setNewMessage] = useState('');
  const [isFilterMode, setIsFilterMode] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  // const socket = useSocket(); // Socket.io removed

  const isLobbyChat = endpoint.includes('lobby');
  const isWhisperChat = endpoint.includes('whisper');
  const isSpecialChat = endpoint.includes('news') || endpoint.includes('system') || endpoint.includes('games');
  const chatRoom = endpoint.split('/').pop(); // Get the chat room from endpoint

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
      return;
    }

    // Initial fetch of messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    fetchMessages();

    /* Socket.io removed
    // Socket.io event handlers
    if (socket) {
      // Join the chat room
      socket.emit('join_chat', chatRoom);

      // Listen for new messages
      socket.on(`chat_message_${chatRoom}`, (message) => {
        setMessages(prev => [...prev, message]);
      });

      // Listen for message updates (edits, deletions)
      socket.on(`message_update_${chatRoom}`, ({ messageId, update }) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, ...update } : msg
        ));
      });

      // Listen for message deletions
      socket.on(`message_delete_${chatRoom}`, (messageId) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      });

      // Cleanup
      return () => {
        socket.emit('leave_chat', chatRoom);
        socket.off(`chat_message_${chatRoom}`);
        socket.off(`message_update_${chatRoom}`);
        socket.off(`message_delete_${chatRoom}`);
      };
    }
    */
  }, [endpoint, initialMessages, chatRoom]);

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
        id: Date.now(),
        userUuid: user.userUuid,
        nickname: user.nickname || "You",
        message: messageContent,
        timestamp: new Date().toISOString(),
        isWhisper: isWhisperChat
      };
      setMessages(prev => [...prev, mockMessage]);
      return;
    }

    try {
      /* Socket.io removed
      if (socket) {
        // Emit message through socket
        socket.emit('chat_message', {
          room: chatRoom,
          message: messageContent,
          userId: user.userUuid
        });
      } else {
      */
      // HTTP-only implementation
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUuid: user.userUuid,
          message: messageContent
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      setMessages(prev => [...prev, data]);
      /* Socket.io removed
      }
      */
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (filter) {
        e.preventDefault();
        onFilterChange('');
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
        onFilterChange('');
      }
    }
  };

  // Memoize filtered messages to prevent unnecessary re-renders
  const filteredMessages = useMemo(() => {
    if (!filter) return messages;
    const searchTerm = filter.toLowerCase();
    return messages.filter(msg => {
      if (!msg) return false;
      const messageText = msg.message?.toLowerCase() || '';
      const nickname = msg.nickname?.toLowerCase() || '';
      return messageText.includes(searchTerm) || nickname.includes(searchTerm);
    });
  }, [messages, filter]);

  const canFilter = isSpecialChat || isFilterMode;
  const showSendButton = !isSpecialChat && !isFilterMode;

  return (
    <div className={`${styles.chatContainer} ${styles[type]}`}>
      <div className={styles.messages}>
        {filteredMessages.length > 0 ? (
          filteredMessages
            .filter(msg => msg && msg.userUuid)  // Ensure message and userUuid exist
            .map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isOwnMessage={user && msg.userUuid === user.userUuid}
              />
            ))
        ) : filter ? (
          <EmptyState message="No messages match your search. Press <ESC> to clear." />
        ) : null}
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
                onChange={(e) => onFilterChange(e.target.value)}
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
              onChange={(e) => canFilter ? onFilterChange(e.target.value) : setNewMessage(e.target.value)}
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