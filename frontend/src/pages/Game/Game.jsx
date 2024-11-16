import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import Chat from '../../components/Chat/Chat';
import PlayerList from '../../components/PlayersList/PlayersList';
import GameBoard from '../../components/GameBoard/GameBoard';
import styles from './Game.module.css';

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game');
      const data = await response.json();
      setGame(data);
    } catch (err) {
      setError('Failed to load game');
    }
  };

  const handleLeaveGame = async () => {
    try {
      await fetch(`/api/games/${gameId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      navigate('/lobby');
    } catch (err) {
      setError('Failed to leave game');
    }
  };

  const handleStartGame = async () => {
    try {
      await fetch(`/api/games/${gameId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      fetchGame();
    } catch (err) {
      setError('Failed to start game');
    }
  };

  if (!game) return null;

  const isCreator = game.createdBy === user.id;
  const canStartGame = isCreator && game.status === 'waiting' && game.players.length >= 2;

  return (
    <motion.div
      className={styles.gameContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h2>Game #{gameId}</h2>
        <div className={styles.headerButtons}>
          {game.status === 'waiting' && (
            isCreator ? (
              <button
                onClick={handleStartGame}
                className={styles.startButton}
                disabled={!canStartGame}
              >
                Start Game
              </button>
            ) : (
              <span className={styles.waitingText}>
                Waiting for host to start...
              </span>
            )
          )}
          <button onClick={handleLeaveGame} className={styles.leaveButton}>
            Leave Game
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <div className={styles.gameArea}>
          <PlayerList
            players={game.players}
            currentUserId={user.id}
            creatorId={game.createdBy}
          />
          {game.status === 'playing' && (
            <GameBoard
              gameState={game.state}
              playerId={user.id}
              onMove={fetchGame}
            />
          )}
        </div>

        <Chat
          endpoint={`/api/chat/game/${gameId}`}
          placeholder="Game chat..."
          className={styles.chat}
        />
      </div>
    </motion.div>
  );
}