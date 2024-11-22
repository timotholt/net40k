import { useState, useCallback, useRef } from 'react';
import Chat from '../Chat/Chat';
import { createPlayerContextMenuItems } from '../PlayerContextMenu/PlayerContextMenu';
import { 
  mockLobbyMessages, 
  mockWhisperMessages, 
  mockNewsMessages, 
  mockSystemMessages,
  mockGameMasterMessages 
} from '../../data/mockChatData';
import styles from './TabbedChat.module.css';

// Mock mode for development
const MOCK_MODE = true;  // Force mock mode to true while we work on session management

export default function TabbedChat() {
  const [activeTab, setActiveTab] = useState('lobby');
  const [filter, setFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const containerRef = useRef(null);

  const tabs = [
    { id: 'lobby', label: 'Lobby' },
    { id: 'whisper', label: 'Whisper' },
    { id: 'news', label: 'News' },
    { id: 'games', label: 'Games' },
    { id: 'system', label: 'System' }
  ];

  // Find current tab index
  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();

      // Calculate next tab index
      const nextIndex = (currentTabIndex + (e.shiftKey ? -1 : 1)) % tabs.length;
      // Handle wrapping
      const newIndex = nextIndex < 0 ? tabs.length - 1 : nextIndex;
      
      // Change tab
      setActiveTab(tabs[newIndex].id);

      // Keep focus on container
      containerRef.current?.focus();
      return;
    }

    if (e.key === 'Escape' && searchFocused) {
      e.preventDefault();
      setFilter('');
      e.target.blur();
      setSearchFocused(false);
      containerRef.current?.focus();
    }
  }, [currentTabIndex, tabs, searchFocused]);

  const handlePlayerAction = (action, playerId) => {
    switch (action) {
      case 'invite':
        console.log('Chat: Invite player:', playerId);
        break;
      case 'whisper':
        console.log('Chat: Whisper to player:', playerId);
        break;
      case 'friend':
        console.log('Chat: Add friend:', playerId);
        break;
      case 'mute':
        console.log('Chat: Mute player:', playerId);
        break;
      case 'report':
        console.log('Chat: Report player:', playerId);
        break;
      case 'block':
        console.log('Chat: Block player:', playerId);
        break;
      default:
        console.log('Chat: Unknown action:', action, playerId);
    }
  };

  const renderChat = () => {
    const commonProps = {
      onInputFocus: () => setSearchFocused(true),
      onInputBlur: () => setSearchFocused(false),
      onInputKeyDown: handleKeyDown,
      filter,
      onFilterChange: setFilter
    };

    // Debug: Log the current active tab and MOCK_MODE
    console.log('Current Active Tab:', activeTab);
    console.log('MOCK_MODE:', MOCK_MODE);

    switch (activeTab) {
      case 'lobby':
        console.log('Lobby Mock Messages:', mockLobbyMessages);
        return (
          <Chat
            endpoint="/api/chat/lobby"
            placeholder="Type message in lobby chat..."
            messages={MOCK_MODE ? mockLobbyMessages : null}
            type="default"
            contextMenuItems={createPlayerContextMenuItems('CHAT_USER_ID', handlePlayerAction)}
            {...commonProps}
          />
        );
      case 'whisper':
        console.log('Whisper Mock Messages:', mockWhisperMessages);
        return (
          <Chat
            endpoint="/api/chat/whisper"
            placeholder="Type whisper message..."
            messages={MOCK_MODE ? mockWhisperMessages : null}
            type="default"
            contextMenuItems={createPlayerContextMenuItems('CHAT_USER_ID', handlePlayerAction)}
            {...commonProps}
          />
        );
      case 'news':
        console.log('News Mock Messages:', mockNewsMessages);
        console.log('News Mock Messages Length:', mockNewsMessages.length);
        return (
          <Chat
            endpoint="/api/chat/news"
            placeholder="Search news..."
            messages={MOCK_MODE ? mockNewsMessages : null}
            type="default"
            {...commonProps}
          />
        );
      case 'games':
        console.log('Game Master Mock Messages:', mockGameMasterMessages);
        console.log('Game Master Mock Messages Length:', mockGameMasterMessages.length);
        return (
          <Chat
            endpoint="/api/chat/games"
            placeholder="Search game notifications..."
            messages={MOCK_MODE ? mockGameMasterMessages : null}
            type="games"
            {...commonProps}
          />
        );
      case 'system':
        console.log('System Mock Messages:', mockSystemMessages);
        console.log('System Mock Messages Length:', mockSystemMessages.length);
        return (
          <Chat
            endpoint="/api/chat/system"
            placeholder="Search system messages..."
            messages={MOCK_MODE ? mockSystemMessages : null}
            type="system"
            {...commonProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={styles.tabbedChatContainer}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.tabs} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={-1}
            data-tab={tab.id}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div 
        className={styles.chatWrapper}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {renderChat()}
      </div>
    </div>
  );
}