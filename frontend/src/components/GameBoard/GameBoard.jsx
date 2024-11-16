import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './GameBoard.module.css';

export default function GameBoard({ gameState, playerId, onMove }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    const tileSize = 32;

    // Set canvas size
    canvas.width = gameState.map[0].length * tileSize;
    canvas.height = gameState.map.length * tileSize;

    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map
    gameState.map.forEach((row, y) => {
      row.forEach((tile, x) => {
        ctx.fillStyle = getTileColor(tile);
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      });
    });

    // Draw players
    gameState.players.forEach(player => {
      ctx.fillStyle = player.id === playerId ? '#0f0' : '#0ff';
      ctx.fillRect(
        player.position.x * tileSize,
        player.position.y * tileSize,
        tileSize,
        tileSize
      );
    });
  }, [gameState, playerId]);

  const handleMove = async (direction) => {
    try {
      const response = await fetch(`/api/games/${gameState.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, direction })
      });

      if (!response.ok) throw new Error('Failed to move');
      onMove();
    } catch (err) {
      console.error('Move failed:', err);
    }
  };

  const getTileColor = (tile) => {
    switch (tile) {
      case 'wall': return '#333';
      case 'floor': return '#222';
      case 'item': return '#ff0';
      default: return '#111';
    }
  };

  if (!gameState) return null;

  return (
    <motion.div
      className={styles.gameBoardContainer}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <canvas
        ref={canvasRef}
        className={styles.gameBoard}
      />
      <div className={styles.controls}>
        <button onClick={() => handleMove('up')}>↑</button>
        <div className={styles.horizontalControls}>
          <button onClick={() => handleMove('left')}>←</button>
          <button onClick={() => handleMove('right')}>→</button>
        </div>
        <button onClick={() => handleMove('down')}>↓</button>
      </div>
    </motion.div>
  );
}