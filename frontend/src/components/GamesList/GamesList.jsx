import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';
import { MODAL_TYPES } from '../../context/ModalContext';
import GameListItem from './components/GameListItem';
import CreateGameTab from './components/CreateGameTab';
import EmptyState from './components/EmptyState';
import styles from './GamesList.module.css';

export default function GamesList({
  games = [],
  activeTab,
  onTabChange,
  filter,
  onFilterChange,
  hideFullGames,
  onHideFullGames,
  hidePasswordGames,
  onHidePasswordGames
}) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);

  // Filter games based on criteria
  const filteredGames = games.filter(game => {
    if (hideFullGames && game.players.length >= game.maxPlayers) return false;
    if (hidePasswordGames && game.isPasswordProtected) return false;
    
    const searchTerm = filter.toLowerCase();
    if (!searchTerm) return true;

    // Convert numeric values to searchable strings
    const playersString = `${game.players.length}/${game.maxPlayers}`;
    const turnString = `turn ${game.turns}`;
    const timeString = game.turnLength === 500 ? '500ms' : `${game.turnLength/1000}s`;

    return (
      game.name.toLowerCase().includes(searchTerm) ||
      game.description.toLowerCase().includes(searchTerm) ||
      game.createdBy.nickname.toLowerCase().includes(searchTerm) ||
      playersString.includes(searchTerm) ||
      turnString.includes(searchTerm) ||
      timeString.includes(searchTerm)
    );
  });

  // Filter games by tab
  const tabFilteredGames = filteredGames.filter(game => {
    switch (activeTab) {
      case 'yours':
        return game.isYours;
      case 'friends':
        return game.isFriendGame;
      default:
        return true;
    }
  });

  const tabs = [
    { id: 'all', label: `All (${filteredGames.length})` },
    { id: 'yours', label: `Yours (${filteredGames.filter(g => g.isYours).length})` },
    { id: 'friends', label: `Friends (${filteredGames.filter(g => g.isFriendGame).length})` },
    { id: 'create', label: 'Create Game' }
  ];

  // Find current tab index
  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = (currentTabIndex + (e.shiftKey ? -1 : 1)) % tabs.length;
      // Handle wrapping
      const newIndex = nextIndex < 0 ? tabs.length - 1 : nextIndex;
      
      if (tabs[newIndex].id !== 'create') {
        onTabChange(tabs[newIndex].id);
      } else {
        // Clear filter when switching to create tab
        onFilterChange('');
        onTabChange('create');
      }
      return;
    }

    if (e.key === 'Escape' && filter) {
      e.preventDefault();
      onFilterChange('');
      if (searchFocused) {
        e.target.blur();
        setSearchFocused(false);
      }
    }
  }, [currentTabIndex, tabs, onTabChange, filter, onFilterChange, searchFocused]);

  const handleJoinGame = (gameId) => {
    const game = games.find(g => g.id === gameId);
    if (game.isPasswordProtected) {
      openModal(MODAL_TYPES.PASSWORD_PROMPT, {
        onSubmit: (password) => {
          navigate(`/game/${gameId}`);
        }
      });
    } else {
      navigate(`/game/${gameId}`);
    }
  };

  const handleViewGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  const handleDeleteGame = (gameId) => {
    openModal(MODAL_TYPES.CONFIRM, {
      title: 'Delete Game',
      message: 'Are you sure you want to delete this game?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/games/${gameId}`, {
            method: 'DELETE'
          });
          if (!response.ok) throw new Error('Failed to delete game');
        } catch (err) {
          console.error('Failed to delete game:', err);
        }
      }
    });
  };

  const getEmptyStateMessage = () => {
    if (filter) {
      return "No games match your search. Press <ESC> to clear.";
    }
    switch (activeTab) {
      case 'yours':
        return "You don't have any created games or characters in any games created by other players.";
      case 'friends':
        return "Your friends haven't created any games.";
      default:
        return "There are no games on the server. Create a game to play!";
    }
  };

  return (
    <div 
      className={styles.gamesContainer}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.tabs} role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={-1}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div 
        className={styles.gamesList}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'create' ? (
          <CreateGameTab />
        ) : tabFilteredGames.length > 0 ? (
          tabFilteredGames.map(game => (
            <GameListItem 
              key={game.id} 
              game={game}
              isSelected={selectedGameId === game.id}
              onSelect={() => setSelectedGameId(game.id)}
              onJoin={handleJoinGame}
              onView={handleViewGame}
              onDelete={handleDeleteGame}
            />
          ))
        ) : (
          <EmptyState message={getEmptyStateMessage()} />
        )}
      </div>

      {activeTab !== 'create' && (
        <div className={styles.filters}>
          <div className={styles.filterControls}>
            <div className={styles.searchWrapper}>
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
                placeholder="Search games..."
                className={styles.searchInput}
                onKeyDown={handleKeyDown}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
            
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
      )}
    </div>
  );
}