import { useCallback } from 'react';

export function useCanvas() {
  const setupCanvas = useCallback((canvas, zoom) => {
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true
    });
    
    const baseSquareSize = 30;
    const squareSize = baseSquareSize * zoom;
    const gap = 2;
    const totalSize = squareSize + gap;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      ctx.scale(dpr, dpr);
      
      return {
        width,
        height,
        cols: Math.ceil(width / totalSize),
        rows: Math.ceil(height / totalSize)
      };
    };

    const { width, height, cols, rows } = resizeCanvas();

    window.addEventListener('resize', resizeCanvas);

    return {
      ctx,
      width,
      height,
      cols,
      rows,
      squareSize,
      totalSize,
      cleanup: () => window.removeEventListener('resize', resizeCanvas)
    };
  }, []);

  const drawFrame = useCallback(({ 
    ctx, 
    width, 
    height, 
    squareSize, 
    totalSize, 
    dungeon, 
    offset,
    activeSquares,
    isAttractMode,
    currentMousePos,
    lightLevels,
    renderConfig = {
      backgroundColor: '#000000',
      tileBackground: '#111111',
      hoverColor: '#33ff33',
      fontSize: 0.8,
      fontFamily: 'monospace',
      minAmbientLight: 0.05,
      maxLightIntensity: 0.8
    }
  }) => {
    if (!dungeon || !dungeon.length) return;

    // Clear background
    ctx.fillStyle = renderConfig.backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate visible area
    const startCol = Math.floor(offset.x / totalSize);
    const startRow = Math.floor(offset.y / totalSize);
    const visibleCols = Math.ceil(width / totalSize) + 2;
    const visibleRows = Math.ceil(height / totalSize) + 2;

    // Setup text rendering
    ctx.font = `${Math.floor(squareSize * renderConfig.fontSize)}px ${renderConfig.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Track current hover state
    let currentKey = null;
    if (currentMousePos) {
      const mouseCol = Math.floor((currentMousePos.x + offset.x) / totalSize);
      const mouseRow = Math.floor((currentMousePos.y + offset.y) / totalSize);
      currentKey = `${mouseCol},${mouseRow}`;
    }

    // Draw dungeon tiles
    for (let row = 0; row < visibleRows; row++) {
      for (let col = 0; col < visibleCols; col++) {
        const x = (col + startCol) * totalSize - offset.x;
        const y = (row + startRow) * totalSize - offset.y;
        
        const currentRow = ((row + startRow) % dungeon.length + dungeon.length) % dungeon.length;
        const currentCol = ((col + startCol) % dungeon[0].length + dungeon[0].length) % dungeon[0].length;
        const cell = dungeon[currentRow][currentCol];
        const key = `${col + startCol},${row + startRow}`;

        // Get lighting for the cell
        let lightLevel = renderConfig.minAmbientLight;
        let lightColor = { r: 0, g: 0, b: 0 };
        
        if (lightLevels) {
          const cellLight = lightLevels[currentRow][currentCol];
          lightLevel = Math.max(renderConfig.minAmbientLight, 
                              Math.min(renderConfig.maxLightIntensity, cellLight.intensity));
          lightColor = cellLight;
        }

        // Draw cell background with lighting
        const bgColor = cell.background || renderConfig.tileBackground;
        const [r, g, b] = hexToRgb(bgColor);
        const litBgColor = `rgb(${
          Math.min(255, r + lightColor.r * lightLevel)},${
          Math.min(255, g + lightColor.g * lightLevel)},${
          Math.min(255, b + lightColor.b * lightLevel)})`;
        
        ctx.fillStyle = litBgColor;
        ctx.fillRect(x, y, squareSize, squareSize);

        // Handle hover and active states
        const activeData = activeSquares.get(key);
        const isCurrentlyHovered = key === currentKey;

        if ((activeData || isCurrentlyHovered) && (isAttractMode || cell.isWalkable)) {
          const age = activeData ? (Date.now() - activeData.startTime) / 1000 : 0;
          if (isCurrentlyHovered || age < 1) {
            ctx.globalAlpha = isCurrentlyHovered ? 0.6 : (0.6 * (1 - age));
            ctx.fillStyle = cell.hoverColor;
            ctx.fillRect(x, y, squareSize, squareSize);
          }
        }

        // Draw cell character with lighting
        const [charR, charG, charB] = hexToRgb(cell.color);
        const litCharColor = `rgb(${
          Math.min(255, charR + lightColor.r * lightLevel)},${
          Math.min(255, charG + lightColor.g * lightLevel)},${
          Math.min(255, charB + lightColor.b * lightLevel)})`;
        
        ctx.globalAlpha = 1;
        ctx.fillStyle = litCharColor;
        ctx.fillText(cell.char, x + squareSize / 2, y + squareSize / 2);
      }
    }

    ctx.globalAlpha = 1;
  }, []);

  return { setupCanvas, drawFrame };
}

function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return [r, g, b];
}