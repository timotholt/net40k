// Shared dungeon-related utility functions
export function getRandomDirection() {
  const rand = Math.random();
  if (rand < 0.4) return { x: -1, y: 0 };
  if (rand < 0.8) return { x: 1, y: 0 };
  if (rand < 0.9) return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

export function createCell(char, isAttractMode = false) {
  const baseCell = {
    char,
    color: getTileColor(char),
    type: getCellType(char),
    isWalkable: isWalkableCell(char),
    isOpaque: isOpaqueCell(char),
    light: getLightProperties(char),
    background: '#111111',
    // Always set hover properties consistently
    hoverColor: '#33ff33',
    cursor: 'pointer'
  };

  // Special case for player
  if (char === '@') {
    baseCell.hoverColor = '#66ff66';
  }

  return baseCell;
}

function getCellType(char) {
  switch (char) {
    case '#': return 'wall';
    case '.': return 'floor';
    case '@': return 'player';
    case 'T': return 'torch';
    case '•': return 'dot';
    case ' ': return 'empty';
    default: return 'unknown';
  }
}

function isWalkableCell(char) {
  return ['.', '@', 'T', '•', ' '].includes(char);
}

function isOpaqueCell(char) {
  return char === '#';
}

function getLightProperties(char) {
  switch (char) {
    case '@': return { 
      intensity: 0.6,
      radius: 6,
      color: { r: 0, g: 128, b: 0 }
    };
    case 'T': return { 
      intensity: 0.8,
      radius: 5,
      color: { r: 255, g: 140, b: 0 }
    };
    case '•': return {
      intensity: 0.0,
      radius: 0,
      color: { r: 0, g: 255, b: 0 }
    };
    default: return null;
  }
}

function getTileColor(char) {
  switch (char) {
    case '#': return '#aaaaaa';
    case '.': return '#666666';
    case '@': return '#00ff00';
    case 'T': return '#ff6600';
    case '•': return '#00ff00';
    case ' ': return '#222222';
    default: return '#222222';
  }
}

export function createDungeon(template, isAttractMode = false) {
  return template.map(row => 
    row.split('').map(char => createCell(char, isAttractMode))
  );
}

export function createAttractDungeon() {
  const template = [
    "############",
    "#..#T...#T.#",
    "#.##.##.#.##",
    "#T.#..#....#",
    "#.##.##.##.#",
    "#....@.T...#",
    "#.##.##.##.#",
    "#..#T.#....#",
    "#.##.#.##.##",
    "#T.#....#T.#",
    "############"
  ];

  return createDungeon(template, true);
}
