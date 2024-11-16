import { useRef, useCallback } from 'react';
import { createCell, createDungeon } from '../utils/dungeonUtils';

export function useDungeon() {
  const dungeon = useRef([]);
  const nextDungeon = useRef(null);
  const isAttractModeRef = useRef(false);

  const updateDungeon = useCallback((newDungeon, isAttractMode = false) => {
    isAttractModeRef.current = isAttractMode;
    
    // If newDungeon is an array of strings, convert it to cell objects
    if (typeof newDungeon[0] === 'string') {
      dungeon.current = createDungeon(newDungeon, isAttractMode);
    } else {
      // Deep clone the dungeon and ensure attract mode properties are preserved
      dungeon.current = newDungeon.map(row => 
        row.map(cell => ({
          ...cell,
          hoverColor: isAttractMode ? '#33ff33' : cell.hoverColor,
          cursor: isAttractMode ? 'pointer' : cell.cursor
        }))
      );
    }
    nextDungeon.current = null;
  }, []);

  const generateRandomDungeon = useCallback((rows, cols, isAttractMode = false) => {
    const template = [];
    for (let row = 0; row < rows; row++) {
      let rowStr = '';
      for (let col = 0; col < cols; col++) {
        const char = col === 0 || col === cols - 1 || row === 0 || row === rows - 1
          ? '#'
          : Math.random() < 0.3 ? '#' : '.';
        rowStr += char;
      }
      template.push(rowStr);
    }

    // Add player to a random walkable position
    let playerPlaced = false;
    while (!playerPlaced) {
      const x = Math.floor(Math.random() * (cols - 2)) + 1;
      const y = Math.floor(Math.random() * (rows - 2)) + 1;
      if (template[y][x] === '.') {
        const rowChars = template[y].split('');
        rowChars[x] = '@';
        template[y] = rowChars.join('');
        playerPlaced = true;
      }
    }

    updateDungeon(template, isAttractMode);
  }, [updateDungeon]);

  const prepareNextFrame = useCallback((direction) => {
    if (nextDungeon.current) return;

    const currentDungeon = dungeon.current;
    if (!currentDungeon.length) return;

    const rows = currentDungeon.length;
    const cols = currentDungeon[0].length;

    // Create a deep copy of the current dungeon, preserving attract mode properties
    const newDungeon = currentDungeon.map(row => 
      row.map(cell => ({...cell}))
    );

    if (direction.x !== 0) {
      // Horizontal scrolling
      newDungeon.forEach((row, i) => {
        if (direction.x > 0) {
          const first = {...row[0]};
          for (let j = 0; j < cols - 1; j++) {
            row[j] = {...row[j + 1]};
          }
          row[cols - 1] = first;
        } else {
          const last = {...row[cols - 1]};
          for (let j = cols - 1; j > 0; j--) {
            row[j] = {...row[j - 1]};
          }
          row[0] = last;
        }
      });
    } else if (direction.y !== 0) {
      // Vertical scrolling
      if (direction.y > 0) {
        const firstRow = newDungeon[0].map(cell => ({...cell}));
        for (let i = 0; i < rows - 1; i++) {
          newDungeon[i] = newDungeon[i + 1].map(cell => ({...cell}));
        }
        newDungeon[rows - 1] = firstRow;
      } else {
        const lastRow = newDungeon[rows - 1].map(cell => ({...cell}));
        for (let i = rows - 1; i > 0; i--) {
          newDungeon[i] = newDungeon[i - 1].map(cell => ({...cell}));
        }
        newDungeon[0] = lastRow;
      }
    }

    nextDungeon.current = newDungeon;
  }, []);

  return {
    dungeon,
    nextDungeon: nextDungeon.current,
    updateDungeon,
    prepareNextFrame,
    generateRandomDungeon
  };
}