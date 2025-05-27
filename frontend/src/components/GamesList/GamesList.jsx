import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameListItem from './components/GameListItem';
import CreateGameTab from './components/CreateGameTab';
import VictoryList from './components/VictoryList/VictoryList';
import EmptyState from '../shared/EmptyState/EmptyState';
import Modal from '../Modal/Modal';
import GameSettingsForm from './components/GameSettingsForm';
import { InputField } from '../FormFields';
import gameService from '../../services/gameService';
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
  const [games, setGames] = useState(initialGames);
  const [victories, setVictories] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingRef = useRef(null);
  const [deleteModalGame, setDeleteModalGame] = useState(null);
  const [settingsModalGame, setSettingsModalGame] = useState(null);
  const [passwordGameToJoin, setPasswordGameToJoin] = useState(null);
  const [passwordAttempt, setPasswordAttempt] = useState('');
  const [passwordError, setPasswordError] = useState(null);

  // Safely fetch games with minimal error handling
  const fetchGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only send filters if they have values
      const filters = {};
      if (activeTab === 'yours') filters.creatorUuid = user?.userUuid;
      if (hideFullGames) filters.status = 'WAITING';

      const result = await gameService.getGames(filters, { 
        page: 1, 
        limit: 50,
        currentUserUuid: user?.userUuid  // Pass current user UUID for ownership check
      });
      setGames(result.games || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch games');
      console.error('Games fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, hideFullGames, user?.userUuid]);

  // Fetch victories
  const fetchVictories = useCallback(async () => {
    if (activeTab !== 'victories') return;
    
    try {
      const result = await gameService.getVictories({ 
        limit: 50,
      });
      setVictories(result.victories || []);
    } catch (err) {
      console.error('Victories fetch error:', err);
    }
  }, [activeTab]);

  // Polling effect - only run when on the lobby page and user is authenticated
  useEffect(() => {
    // Only fetch if we're on the lobby page and have a user
    const isLobbyPage = window.location.pathname === '/lobby';
    
    if (isLobbyPage && user?.userUuid) {
      // Initial fetch
      fetchGames();
      if (activeTab === 'victories') {
        fetchVictories();
      }

      // Setup polling interval
      pollingRef.current = setInterval(() => {
        fetchGames();
        if (activeTab === 'victories') {
          fetchVictories();
        }
      }, 5000);
    }

    // Cleanup function
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [fetchGames, fetchVictories, activeTab, user?.userUuid]);

  // Filter games based on criteria
  const filteredGames = games.filter(game => {
    if (hideFullGames && game.players.length >= game.maxPlayers) return false;
    if (hidePasswordGames && game.hasPassword) return false;
    
    const searchTerm = filter.toLowerCase();
    if (!searchTerm) return true;

    // Convert numeric values to searchable strings
    const playersString = `${game.players.length}/${game.maxPlayers}`;
    const turnString = `turn ${game.turns}`;
    const timeString = game.turnLength === 500 ? '500ms' : `${game.turnLength/1000}s`;

    return (
      game.name.toLowerCase().includes(searchTerm) ||
      game.description.toLowerCase().includes(searchTerm) ||
      game.creatorNickname.toLowerCase().includes(searchTerm) ||
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
    { id: 'victories', label: 'Victories' },
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

  const handleJoinGame = useCallback((gameUuid) => {
    const game = games.find(g => g.gameUuid === gameUuid);
    
    if (game.hasPassword) {
      // Open password prompt modal
      setPasswordGameToJoin(game);
      setPasswordAttempt('');
      setPasswordError(null);
    } else {
      // Directly navigate to game if no password
      navigate(`/game/${gameUuid}`);
    }
  }, [games, navigate]);

  const handlePasswordSubmit = useCallback(async () => {
    if (!passwordGameToJoin) return;

    try {
      // Attempt to join the game with the provided password
      const response = await fetch(`/api/games/${passwordGameToJoin.gameUuid}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordAttempt })
      });

      if (response.ok) {
        // Successful join - navigate to game
        navigate(`/game/${passwordGameToJoin.gameUuid}`);
      } else {
        // Handle different error scenarios
        const errorData = await response.json();
        setPasswordError(errorData.message || 'Invalid password');
      }
    } catch (error) {
      console.error('Join game error:', error);
      setPasswordError('An error occurred. Please try again.');
    }
  }, [passwordGameToJoin, passwordAttempt, navigate]);

  const handleViewGame = (gameUuid) => {
    navigate(`/game/${gameUuid}`);
  };

  const handleDeleteGame = useCallback((gameUuid) => {
    // Open delete confirmation modal
    const gameToDelete = games.find(g => g.gameUuid === gameUuid);
    setDeleteModalGame(gameToDelete);
  }, [games]);

  const confirmDeleteGame = useCallback(async () => {
    if (!deleteModalGame) return;

    try {
      // Call game service to delete the game
      await gameService.deleteGame(deleteModalGame.gameUuid);

      // Optimistically remove the game from the local state
      setGames(prevGames => 
        prevGames.filter(game => game.gameUuid !== deleteModalGame.gameUuid)
      );

      // Close the delete modal
      setDeleteModalGame(null);
    } catch (error) {
      console.error('Delete game error:', error);
      // Optionally set an error state to show in the modal
      // You might want to add a more user-friendly error handling mechanism
    }
  }, [deleteModalGame]);

  const handleGameSettings = useCallback(async (gameUuid) => {
    try {
      console.log('GAMES LIST: Fetching Game Settings', { gameUuid });
      
      // Fetch game settings
      const gameSettings = await gameService.getGameSettings(gameUuid);
      
      console.log('GAMES LIST: Fetched Game Settings FULL', { 
        gameUuid, 
        gameSettings: JSON.parse(JSON.stringify(gameSettings)),
        hasPassword: gameSettings.hasPassword,
        password: gameSettings.password ? '[REDACTED]' : null,
        keys: Object.keys(gameSettings)
      });

      // Open settings modal with ALL fetched settings
      setSettingsModalGame({
        ...gameSettings,
        gameUuid: gameSettings.gameUuid
      });
    } catch (error) {
      console.error('Failed to fetch game settings:', {
        gameUuid,
        error: error.response?.data || error.message,
        fullError: error
      });
      // Optionally show an error message to the user
    }
  }, []);

  const handleUpdateGameSettings = useCallback(async (updatedGameData) => {
    if (!settingsModalGame) return;

    try {
      // Close the settings modal
      setSettingsModalGame(null);

      // Refresh the games list to reflect the update
      await fetchGames();
    } catch (error) {
      console.error('Failed to update game settings:', error);
      // Optionally show an error message to the user
    }
  }, [settingsModalGame, fetchGames]);

  const getEmptyStateMessage = () => {
    if (filter) {
      return "No games match your search. Press<ESC>to clear.";
    }
    switch (activeTab) {
      case 'yours':
        return "You don't have any created games or characters in any games created by other players.";
      case 'friends':
        return "Your friends haven't created any games.";
      case 'victories':
        return "No victories recorded yet. Be the first to achieve victory!";
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
        className={styles.gamesListContainer}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        <div 
          className={styles.gamesList}
        >
          {activeTab === 'victories' ? (
            victories.length > 0 ? (
              <VictoryList victories={victories} filter={filter} />
            ) : (
              <EmptyState message={getEmptyStateMessage()} />
            )
          ) : activeTab === 'create' ? (
            <CreateGameTab />
          ) : tabFilteredGames.length > 0 ? (
            tabFilteredGames.map(game => (
              <GameListItem
                key={game.gameUuid}
                game={game}
                isSelected={selectedGameId === game.gameUuid}
                onSelect={() => setSelectedGameId(game.gameUuid)}
                onJoin={handleJoinGame}
                onView={handleViewGame}
                onDelete={handleDeleteGame}
                onGameSettings={handleGameSettings}
              />
            ))
          ) : (
            <EmptyState message={getEmptyStateMessage()} />
          )}
        </div>

        {activeTab !== 'create' && (
          <div className={styles.filterSection}>
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
                  autoComplete='off'
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
                  Hide password games
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Settings Modal */}
      {settingsModalGame && (
        <Modal
          isOpen={!!settingsModalGame}
          onClose={() => setSettingsModalGame(null)}
          title="Game Settings"
          actions={[]}
        >
        <GameSettingsForm
          initialGame={{
            gameUuid: settingsModalGame.gameUuid,
            name: settingsModalGame.name,
            description: settingsModalGame.description || '',
            maxPlayers: settingsModalGame.maxPlayers,
            turnLength: settingsModalGame.turnLength,
            hasPassword: !!settingsModalGame.hasPassword,
            password: settingsModalGame.password || ''
          }}
          onSubmit={handleUpdateGameSettings}
          onCancel={() => setSettingsModalGame(null)}
        />
        </Modal>
      )}

      {/* Password-Protected Game Join Modal */}
      {passwordGameToJoin && (
        <Modal
          isOpen={!!passwordGameToJoin}
          onClose={() => {
            setPasswordGameToJoin(null);
            setPasswordAttempt('');
            setPasswordError(null);
          }}
          title={`Join Game: ${passwordGameToJoin.name}`}
          actions={[
            {
              label: 'Join Game',
              onClick: handlePasswordSubmit,
              className: 'btn-primary'
            },
            {
              label: 'Cancel',
              onClick: () => {
                setPasswordGameToJoin(null);
                setPasswordAttempt('');
                setPasswordError(null);
              }
            }
          ]}
        >
          <div>
            <p>This game is password protected. Please enter the game password.</p>
            <InputField 
              type="password"
              label="Game Password"
              name="gamePassword"
              value={passwordAttempt}
              onChange={(e) => {
                setPasswordAttempt(e.target.value);
                setPasswordError(null);
              }}
              placeholder="Enter game password"
              required
            />
            {passwordError && (
              <div style={{ color: 'red', marginTop: '10px' }}>
                {passwordError}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalGame && (
        <Modal
          isOpen={!!deleteModalGame}
          onClose={() => setDeleteModalGame(null)}
          title="Delete Game"
          actions={[
            {
              label: 'Delete',
              onClick: confirmDeleteGame,
              className: 'btn-danger'
            },
            {
              label: 'Cancel',
              onClick: () => setDeleteModalGame(null)
            }
          ]}
        >
          <p>Are you sure you want to delete the game "{deleteModalGame.name}"?</p>
          <p>This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}