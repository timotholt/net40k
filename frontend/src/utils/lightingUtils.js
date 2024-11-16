export function calculateLighting(dungeon) {
  if (!dungeon || !dungeon.length || !dungeon[0]) return null;
  
  const rows = dungeon.length;
  const cols = dungeon[0].length;
  const lightLevels = Array(rows).fill(0).map(() => 
    Array(cols).fill(0).map(() => ({ r: 0, g: 0, b: 0, intensity: 0 }))
  );

  // Find all light sources
  dungeon.forEach((row, y) => {
    if (row) {
      row.forEach((cell, x) => {
        if (cell && cell.light && cell.light.intensity > 0) {
          applyLightSource(lightLevels, dungeon, x, y, cell.light);
        }
      });
    }
  });

  return lightLevels;
}

function applyLightSource(lightLevels, dungeon, sourceX, sourceY, light) {
  if (!dungeon || !dungeon.length || !dungeon[0]) return;

  const { intensity, radius, color } = light;
  const rows = dungeon.length;
  const cols = dungeon[0].length;

  // Apply maximum intensity to source cell with increased brightness
  if (isValidPosition(sourceY, sourceX, rows, cols)) {
    lightLevels[sourceY][sourceX] = {
      r: color.r,
      g: color.g,
      b: color.b,
      intensity: intensity * 3
    };
  }

  // Inverse square law constants - adjusted for gentler falloff
  const falloffStart = 0.7;
  const maxIntensity = intensity;
  const falloffExponent = 1.6;

  for (let y = Math.max(0, sourceY - radius); y < Math.min(rows, sourceY + radius + 1); y++) {
    for (let x = Math.max(0, sourceX - radius); x < Math.min(cols, sourceX + radius + 1); x++) {
      // Skip source cell as it's already set
      if (x === sourceX && y === sourceY) continue;

      if (hasLineOfSight(dungeon, sourceX, sourceY, x, y, rows, cols)) {
        // Calculate base distance
        let distance = Math.sqrt(Math.pow(x - sourceX, 2) + Math.pow(y - sourceY, 2));
        
        // Apply diagonal bias - reduce distance by 15% if it's a diagonal
        if (x !== sourceX && y !== sourceY) {
          distance *= 0.85;
        }

        if (distance <= radius) {
          // Modified inverse square law with balanced falloff
          const normalizedDist = Math.max(distance - falloffStart, 0);
          const falloff = 1 / Math.pow(1 + normalizedDist, falloffExponent);
          const lightValue = maxIntensity * falloff;
          
          // Add colored light contribution
          const currentLight = lightLevels[y][x];
          currentLight.r = Math.min(255, currentLight.r + color.r * lightValue);
          currentLight.g = Math.min(255, currentLight.g + color.g * lightValue);
          currentLight.b = Math.min(255, currentLight.b + color.b * lightValue);
          currentLight.intensity = Math.max(currentLight.intensity, lightValue);
        }
      }
    }
  }
}

function isValidPosition(y, x, rows, cols) {
  return y >= 0 && y < rows && x >= 0 && x < cols;
}

function hasLineOfSight(dungeon, x0, y0, x1, y1, rows, cols) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    if (x === x1 && y === y1) return true;
    
    // Check if current position is valid and cell exists
    if (!isValidPosition(y, x, rows, cols) || !dungeon[y] || !dungeon[y][x]) {
      return false;
    }
    
    // Check if current cell blocks light
    if (dungeon[y][x].isOpaque) return false;
    
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
}
