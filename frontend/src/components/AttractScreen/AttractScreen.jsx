import { useMemo, useState } from 'react';
import { useZoom } from '../../context/ZoomContext';
import DungeonRenderer from '../DungeonRenderer/DungeonRenderer';
import ZoomControls from '../ZoomControls/ZoomControls';
import { getRandomDirection } from '../../utils/dungeonUtils';
import { calculateLighting } from '../../utils/lightingUtils';

const ATTRACT_DUNGEON = [
  // "############",
  // "#..#T...#T.#",
  // "#.##.##.#.##",
  // "#T.#..#....#",
  // "#.##.##.##.#",
  // "#....@.T...#",
  // "#.##.##.##.#",
  // "#..#T.#....#",
  // "#.##.#.##.##",
  // "#T.#....#T.#",
  // "############"
  "•    •    •   •   •   •   •   •   •   •   •   •   •   •   •   •   ",
  "                                                                  ",
  "                                                                  ",
  "                                                                  ",
  "•    •    •   •   •   •   •   •   •   •   •   •   •   •   •   •   ",
  "                                                                  ",
  "                                                                  ",
  "                                                                  ",
  "•    •    •   •   •   •   •   •   •   •   •   •   •   •   •   •   ",
  "                                                                  ",
  "                                                                  ",
  "                                                                  ",
  "•    •    •   •   •   •   •   •   •   •   •   •   •   •   •   •   ",
  "                                                                  ",
  "                                                                  ",
  "                                                                  "
];

export default function AttractScreen() {
  const { zoom } = useZoom();
  const [scrollDirection] = useState(() => getRandomDirection());
  
  const dungeonConfig = useMemo(() => ({
    scrollSpeed: 0.3
  }), []);

  return (
    <>
      <DungeonRenderer
        dungeonMap={ATTRACT_DUNGEON}
        zoom={zoom}
        scrollDirection={scrollDirection}
        scrollSpeed={dungeonConfig.scrollSpeed}
        isAttractMode={true}
        calculateLighting={calculateLighting}
      />
      <ZoomControls />
    </>
  );
}