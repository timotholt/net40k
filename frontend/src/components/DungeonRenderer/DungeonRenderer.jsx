import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useCanvas } from '../../hooks/useCanvas';
import { useDungeon } from '../../hooks/useDungeon';
import { useZoom } from '../../context/ZoomContext';
import { getRandomDirection } from '../../utils/dungeonUtils';
import styles from './DungeonRenderer.module.css';

function DungeonRenderer({ 
  dungeonMap, 
  scrollDirection = null, 
  scrollSpeed = 0.5,
  //isAttractMode = false,
  isAttractMode = true,

  calculateLighting
}) {
  const { zoom, setZoom } = useZoom();
  const canvasRef = useRef(null);
  const activeSquares = useRef(new Map());
  const currentMousePos = useRef(null);
  const { setupCanvas, drawFrame } = useCanvas();
  const { 
    dungeon,
    nextDungeon,
    updateDungeon,
    prepareNextFrame,
    generateRandomDungeon
  } = useDungeon();

  const offsetRef = useRef({ x: 0, y: 0 });
  const directionRef = useRef(scrollDirection || getRandomDirection());
  const isInitializedRef = useRef(false);
  const lastFrameTimeRef = useRef(0);
  const frameRequestRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    document.body.style.overflow = 'hidden';

    const handleWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = -Math.sign(e.deltaY) * 0.1;
        setZoom(delta);
      }
    };

    const {
      ctx,
      width,
      height,
      cols,
      rows,
      squareSize,
      totalSize,
      cleanup
    } = setupCanvas(canvas, zoom);

    if (!isInitializedRef.current) {
      if (dungeonMap) {
        updateDungeon(dungeonMap, isAttractMode);
      } else {
        generateRandomDungeon(rows, cols, isAttractMode);
      }
      isInitializedRef.current = true;
    }

    const render = (timestamp) => {
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      const scrollAmount = (scrollSpeed * deltaTime) / 16.67;
      offsetRef.current.x += directionRef.current.x * scrollAmount;
      offsetRef.current.y += directionRef.current.y * scrollAmount;

      if (Math.abs(offsetRef.current.x) >= totalSize * 0.9 || 
          Math.abs(offsetRef.current.y) >= totalSize * 0.9) {
        prepareNextFrame(directionRef.current);
      }

      if (Math.abs(offsetRef.current.x) >= totalSize || 
          Math.abs(offsetRef.current.y) >= totalSize) {
        if (nextDungeon) {
          updateDungeon(nextDungeon, isAttractMode);
          offsetRef.current = { x: 0, y: 0 };
        }
      }

      const now = Date.now();
      for (const [key, data] of activeSquares.current.entries()) {
        const age = (now - data.startTime) / 1000;
        if (age >= 1) {
          activeSquares.current.delete(key);
        }
      }

      // Calculate lighting if the function is provided
      const lightLevels = calculateLighting ? calculateLighting(dungeon.current) : null;

      drawFrame({
        ctx,
        width,
        height,
        squareSize,
        totalSize,
        dungeon: dungeon.current,
        offset: offsetRef.current,
        activeSquares: activeSquares.current,
        isAttractMode,
        currentMousePos: currentMousePos.current,
        lightLevels
      });

      frameRequestRef.current = requestAnimationFrame(render);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      currentMousePos.current = { x, y };

      const col = Math.floor((x + offsetRef.current.x) / totalSize);
      const row = Math.floor((y + offsetRef.current.y) / totalSize);
      const key = `${col},${row}`;
      
      if (isAttractMode || dungeon.current[row]?.[col]?.isWalkable) {
        activeSquares.current.set(key, {
          startTime: Date.now(),
          color: '#33ff33'
        });
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    };

    const handleMouseLeave = () => {
      currentMousePos.current = null;
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    frameRequestRef.current = requestAnimationFrame(render);

    return () => {
      cleanup();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('wheel', handleWheel);
      cancelAnimationFrame(frameRequestRef.current);
      document.body.style.overflow = '';
    };
  }, [
    dungeonMap,
    zoom,
    scrollDirection,
    scrollSpeed,
    isAttractMode,
    setupCanvas,
    drawFrame,
    updateDungeon,
    generateRandomDungeon,
    prepareNextFrame,
    setZoom,
    calculateLighting
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    />
  );
}

DungeonRenderer.propTypes = {
  dungeonMap: PropTypes.arrayOf(PropTypes.string),
  scrollDirection: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number
  }),
  scrollSpeed: PropTypes.number,
  isAttractMode: PropTypes.bool,
  calculateLighting: PropTypes.func
};

export default DungeonRenderer;