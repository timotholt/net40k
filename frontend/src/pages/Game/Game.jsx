import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';
import Chat from '../../components/Chat/Chat';
import PlayerList from '../../components/PlayersList/PlayersList';
import GameBoard from '../../components/GameBoard/GameBoard';
import styles from './Game.module.css';

export default function Game() {
  const { gameUuid } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [game, setGame] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGame();
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }, [gameUuid]);

  const fetchGame = async () => {
    try {
      const response = await fetch(`/api/games/${gameUuid}`);
      if (!response.ok) throw new Error('Failed to fetch game');
      const data = await response.json();
      setGame(data);
    } catch (err) {
      setError('Failed to load game');
    }
  };

  const handleLeaveGame = async () => {
    try {
      await fetch(`/api/games/${gameUuid}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUuid: user.userUuid })
      });
      navigate('/lobby');
    } catch (err) {
      setError('Failed to leave game');
    }
  };

  const handleStartGame = async () => {
    try {
      await fetch(`/api/games/${gameUuid}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userUuid: user.userUuid })
      });
      fetchGame();
    } catch (err) {
      setError('Failed to start game');
    }
  };

  if (!game) return null;

  const isCreator = game.creatorUuid === user.userUuid;
  const canStartGame = isCreator && game.status === 'WAITING' && game.players.length >= 2;

  return (
    <motion.div
      className={styles.gameContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <h2>Game #{gameUuid}</h2>
        <div className={styles.headerButtons}>
          {game.status === 'WAITING' && (
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
            currentUserId={user.userUuid}
            creatorId={game.creatorUuid}
          />
          {game.status === 'IN_PROGRESS' && (
            <GameBoard
              gameState={game.state}
              playerId={user.userUuid}
              onMove={fetchGame}
            />
          )}
        </div>

        <Chat
          endpoint={`/api/chat/game/${gameUuid}`}
          placeholder="Game chat..."
          className={styles.chat}
        />
      </div>
    </motion.div>
  );
}