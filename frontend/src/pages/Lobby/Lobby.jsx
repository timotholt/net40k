import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import GamesList from '../../components/GamesList/GamesList';
import PlayersList from '../../components/PlayersList/PlayersList';
import TabbedChat from '../../components/TabbedChat/TabbedChat';
import { mockGames } from '../../data/mockGameData';
import styles from './Lobby.module.css';

// Mock mode for development
const MOCK_MODE = true;

export default function Lobby() {
  const user = useSelector(selectUser);
  const [activeGamesTab, setActiveGamesTab] = useState('all');
  const [games] = useState(MOCK_MODE ? mockGames : []);
  const [gamesFilter, setGamesFilter] = useState('');
  const [hideFullGames, setHideFullGames] = useState(false);
  const [hidePasswordGames, setHidePasswordGames] = useState(false);

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
            games={games}
            activeTab={activeGamesTab}
            onTabChange={setActiveGamesTab}
            filter={gamesFilter}
            onFilterChange={setGamesFilter}
            hideFullGames={hideFullGames}
            onHideFullGames={setHideFullGames}
            hidePasswordGames={hidePasswordGames}
            onHidePasswordGames={setHidePasswordGames}
          />
          
          <PlayersList />
        </div>

        <div className={styles.bottomSection}>
          <TabbedChat />
        </div>
      </div>
    </motion.div>
  );
}