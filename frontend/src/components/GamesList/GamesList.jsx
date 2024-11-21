import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../../context/ModalContext';
import { MODAL_TYPES } from '../../context/ModalContext';
import GameListItem from './components/GameListItem';
import CreateGameTab from './components/CreateGameTab';
import EmptyState from './components/EmptyState';
import GameService from '../../services/GameService';
import styles from './GamesList.module.css';

export default function GamesList({
  games: initialGames = [],
  activeTab,
  onTabChange,
  filter,
  onFilterChange,
  hideFullGames,
  onHideFullGames,
  hidePasswordGames,
  onHidePasswordGames,
  user
}) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [games, setGames] = useState(initialGames);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);

  // Safely fetch games with minimal error handling
  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only send filters if they have values
      const filters = {};
      if (activeTab === 'yours') filters.creatorUuid = user?.userUuid;
      if (hideFullGames) filters.status = 'WAITING';

      const result = await GameService.getGames(filters);
      setGames(result.games || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch games');
      console.error('Games fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, hideFullGames, user?.userUuid]);

  // Polling effect
  useEffect(() => {
    // Initial fetch
    fetchGames();

    // Setup polling interval
    pollingRef.current = setInterval(fetchGames, 5000);

    // Cleanup function
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchGames]);

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

  const handleDeleteGame = useCallback(async (game) => {
    // Only allow deletion of own games
    if (!game.isYours) {
      openModal(MODAL_TYPES.ALERT, {
        title: 'Cannot Delete Game',
        message: 'You can only delete your own games.'
      });
      return;
    }

    // Confirm deletion
    const confirmed = await openModal(MODAL_TYPES.CONFIRM, {
      title: 'Delete Game',
      message: `Are you sure you want to delete the game "${game.name}"?`
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await GameService.deleteGame(game.id);
      
      // Remove the game from the list
      setGames(prevGames => prevGames.filter(g => g.id !== game.id));
      
      openModal(MODAL_TYPES.ALERT, {
        title: 'Game Deleted',
        message: `The game "${game.name}" has been successfully deleted.`
      });
    } catch (error) {
      openModal(MODAL_TYPES.ALERT, {
        title: 'Delete Failed',
        message: error.response?.data?.error || 'Failed to delete game. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  }, [openModal, setGames]);

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
              onDelete={() => handleDeleteGame(game)}
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