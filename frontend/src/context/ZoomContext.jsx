import { createContext, useContext, useState, useCallback } from 'react';

const ZoomContext = createContext(null);

export function ZoomProvider({ children, initialZoom = 0.8, minZoom = 0.2, maxZoom = 2 }) {
  const [zoom, setZoom] = useState(initialZoom);

  const handleZoomChange = useCallback((delta) => {
    setZoom(prev => Math.max(minZoom, Math.min(maxZoom, prev + delta)));
  }, [minZoom, maxZoom]);

  return (
    <ZoomContext.Provider value={{ zoom, setZoom: handleZoomChange, minZoom, maxZoom }}>
      {children}
    </ZoomContext.Provider>
  );
}

export function useZoom() {
  const context = useContext(ZoomContext);
  if (!context) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
}