import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import GamesList from '../../components/GamesList/GamesList';
import PlayersList from '../../components/PlayersList/PlayersList';
import TabbedChat from '../../components/TabbedChat/TabbedChat';
import { mockGames } from '../../data/mockGameData';
import { mockPlayers } from '../../data/mockPlayerData';
import styles from './Lobby.module.css';

// Mock mode for development
const MOCK_MODE = true;

export default function Lobby() {
  const { user } = useAuth();
  const [activeGamesTab, setActiveGamesTab] = useState('all');
  const [activePlayersTab, setActivePlayersTab] = useState('all');
  const [games, setGames] = useState(MOCK_MODE ? mockGames : []);
  const [players, setPlayers] = useState(MOCK_MODE ? mockPlayers : []);
  const [gamesFilter, setGamesFilter] = useState('');
  const [playersFilter, setPlayersFilter] = useState('');
  const [hideFullGames, setHideFullGames] = useState(false);
  const [hidePasswordGames, setHidePasswordGames] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (MOCK_MODE) return;

    const fetchData = async () => {
      try {
        const gamesResponse = await fetch('/api/games');
        const playersResponse = await fetch('/api/players');
        
        if (!gamesResponse.ok || !playersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const gamesData = await gamesResponse.json();
        const playersData = await playersResponse.json();

        setGames(gamesData);
        setPlayers(playersData);
      } catch (err) {
        setError('Failed to load lobby data');
        console.error('Lobby data fetch error:', err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter players
  const filteredPlayers = players.filter(player => {
    if (!playersFilter) return true;
    return player.nickname.toLowerCase().includes(playersFilter.toLowerCase());
  });

  return (
    <motion.div
      className={styles.lobbyContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.content}>
        <div className={styles.topSection}>
          <GamesList
            games={games} // Pass the full, unfiltered games list
            activeTab={activeGamesTab}
            onTabChange={setActiveGamesTab}
            filter={gamesFilter}
            onFilterChange={setGamesFilter}
            hideFullGames={hideFullGames}
            onHideFullGames={setHideFullGames}
            hidePasswordGames={hidePasswordGames}
            onHidePasswordGames={setHidePasswordGames}
          />
          
          <PlayersList
            players={filteredPlayers}
            activeTab={activePlayersTab}
            onTabChange={setActivePlayersTab}
            filter={playersFilter}
            onFilterChange={setPlayersFilter}
          />
        </div>

        <div className={styles.bottomSection}>
          <TabbedChat />
        </div>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}
    </motion.div>
  );
}