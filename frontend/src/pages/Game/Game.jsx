import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectUser, selectIsAuthenticated } from '../../store/authSlice';
import Chat from '../../components/Chat/Chat';
import GameBoard from '../../components/GameBoard/GameBoard';
import styles from './Game.module.css';

export default function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Mock game data
  const mockGame = {
    id: gameId,
    status: 'WAITING',
    players: [
      { userUuid: user?.userUuid || 'mock-user', username: 'You' },
      { userUuid: 'mock-player-2', username: 'Player 2' }
    ],
    creatorUuid: user?.userUuid || 'mock-user',
    state: {}
  };

  const handleLeaveGame = () => {
    console.log('Leave game clicked');
    console.log('Is authenticated:', isAuthenticated);
    navigate('/lobby');
    console.log('Navigation called');
  };

  const isCreator = mockGame.creatorUuid === user?.userUuid;

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleLeaveGame} className={styles.backButton}>
            ← Back to Lobby
          </button>
          <h2>Game #{gameId}</h2>
        </div>
        <div className={styles.headerButtons}>
          {mockGame.status === 'WAITING' && (
            isCreator ? (
              <button
                className={styles.startButton}
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

      <div className={styles.content}>
        {/* <div className={styles.gameArea}>
          {mockGame.status === 'IN_PROGRESS' ? (
            <GameBoard
              gameState={mockGame.state}
              playerId={user?.userUuid || 'mock-user'}
            />
          ) : (
            <div className={styles.gamePlaceholder}>
              Game will go here
            </div>
          )}
        </div> */}

        <Chat
          endpoint={`/api/chat/game/${gameId}`}
          placeholder="Game chat..."
          className={styles.chat}
        />
      </div>
    </motion.div>
  );
}