import React from 'react';
import PropTypes from 'prop-types';
import styles from './VictoryList.module.css';

export default function VictoryList({ victories, filter }) {
  const filteredVictories = victories.filter(victory => {
    if (!filter) return true;
    
    const searchTerm = filter.toLowerCase();
    const turnString = `turn ${victory.turnCount}`;
    
    return (
      victory.nickname.toLowerCase().includes(searchTerm) ||
      victory.faction.toLowerCase().includes(searchTerm) ||
      victory.type.toLowerCase().includes(searchTerm) ||
      turnString.includes(searchTerm) ||
      (victory.description && victory.description.toLowerCase().includes(searchTerm))
    );
  });

  return (
    <div className={styles.victoryList}>
      {filteredVictories.map((victory) => (
        <div key={victory.gameUuid} className={styles.victoryItem}>
          <div className={styles.header}>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>{victory.nickname}</span>
              <span className={styles.faction}>({victory.faction})</span>
            </div>
            <div className={styles.victoryDetails}>
              <span className={styles.victoryType}>{victory.type}</span>
              <span className={styles.turnCount}>Turn {victory.turnCount}</span>
            </div>
          </div>
          {victory.description && (
            <div className={styles.description}>{victory.description}</div>
          )}
        </div>
      ))}
    </div>
  );
}

VictoryList.propTypes = {
  victories: PropTypes.arrayOf(
    PropTypes.shape({
      gameUuid: PropTypes.string.isRequired,
      players: PropTypes.arrayOf(PropTypes.string).isRequired,
      nickname: PropTypes.string.isRequired,
      faction: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      turnCount: PropTypes.number.isRequired,
    })
  ).isRequired,
  filter: PropTypes.string,
};
