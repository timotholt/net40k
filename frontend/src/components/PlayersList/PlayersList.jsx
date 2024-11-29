import { useState, useCallback, useEffect, useRef } from 'react';
import PlayersListHeader from './components/PlayersListHeader';
import PlayersListFilters from './components/PlayersListFilters';
import PlayerListItem from './components/PlayerListItem';
import EmptyState from '../shared/EmptyState/EmptyState';
import userService from '../../services/userService';
import styles from './PlayersList.module.css';

export default function PlayersList() {
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedUserUuid, setSelectedUserUuid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Polling configuration
  const POLLING_INTERVAL = 5000; // 5 seconds
  const pollingTimeoutRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await userService.getUsers({}, { 
        page: pagination.page, 
        limit: pagination.limit 
      });
      setPlayers(result.users);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  // Setup polling
  useEffect(() => {
    // Initial fetch
    fetchUsers();

    // Setup polling interval
    const startPolling = () => {
      pollingTimeoutRef.current = setTimeout(async () => {
        await fetchUsers();
        startPolling(); // Schedule next poll after current one completes
      }, POLLING_INTERVAL);
    };

    startPolling();

    // Cleanup function
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, [fetchUsers]); // Only re-run if fetchUsers changes

  const tabs = [
    { id: 'all', label: `All (${pagination.total})` },
    { id: 'friends', label: `Friends (${players.filter(p => p.isFriend).length})` }
  ];

  // Find current tab index
  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextIndex = (currentTabIndex + (e.shiftKey ? -1 : 1)) % tabs.length;
      // Handle wrapping
      const newIndex = nextIndex < 0 ? tabs.length - 1 : nextIndex;
      setActiveTab(tabs[newIndex].id);
      return;
    }

    if (e.key === 'Escape' && filter) {
      e.preventDefault();
      setFilter('');
      if (searchFocused) {
        e.target.blur();
        setSearchFocused(false);
      }
    }
  }, [currentTabIndex, tabs, filter, searchFocused]);

  const handleSelect = (userUuid) => {
    console.log('PlayersList - handleSelect:', { 
      userUuid, 
      currentSelectedUuid: selectedUserUuid,
      willSelect: userUuid === selectedUserUuid ? null : userUuid 
    });
    setSelectedUserUuid(userUuid === selectedUserUuid ? null : userUuid);
  };

  const handleWhisper = (userUuid) => {
    console.log('Whisper to:', userUuid);
  };

  const handleAddFriend = (userUuid) => {
    console.log('Add friend:', userUuid);
  };

  const handleContainerContextMenu = (e) => {
    e.preventDefault(); // Prevent browser context menu on container
  };

  const filteredPlayers = players.filter(player => {
    if (activeTab === 'friends' && !player.isFriend) return false;
    if (!filter) return true;
    return player.nickname.toLowerCase().includes(filter.toLowerCase());
  });

  const getEmptyStateMessage = () => {
    if (filter) {
      return "No matches. Press<ESC>to clear.";
    }
    return activeTab === 'friends' 
      ? "You haven't added any friends yet."
      : "There are no players online.";
  };

  return (
    <div 
      className={styles.playersContainer}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContainerContextMenu}
    >
      <PlayersListHeader 
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={setActiveTab}
      />

      <div className={styles.playersListContainer}>
        <div 
          className={styles.playersList}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          onContextMenu={handleContainerContextMenu}
        >
          {loading ? (
            <EmptyState message="Loading..." />
          ) : error ? (
            <EmptyState message={error} />
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map(player => (
              <PlayerListItem
                key={player.userUuid}
                player={player}
                isSelected={selectedUserUuid === player.userUuid}
                onSelect={handleSelect}
                onWhisper={handleWhisper}
                onAddFriend={handleAddFriend}
              />
            ))
          ) : (
            <EmptyState message={getEmptyStateMessage()} />
          )}
        </div>

        <PlayersListFilters
          filter={filter}
          onFilterChange={setFilter}
          onKeyDown={handleKeyDown}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>
    </div>
  );
}