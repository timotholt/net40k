import { useState, useCallback, useRef, useEffect } from 'react';

export function useStatusBarVisibility(hideDelay = 1000) {
  const [isVisible, setIsVisible] = useState(true);
  const hideTimeoutRef = useRef(null);
  const isMouseOverRef = useRef(false);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const startHideTimeout = useCallback(() => {
    clearHideTimeout();
    if (!isMouseOverRef.current) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    }
  }, [hideDelay, clearHideTimeout]);

  const onMouseEnter = useCallback(() => {
    isMouseOverRef.current = true;
    setIsVisible(true);
    clearHideTimeout();
  }, [clearHideTimeout]);

  const onMouseLeave = useCallback(() => {
    isMouseOverRef.current = false;
    startHideTimeout();
  }, [startHideTimeout]);

  // Start hide timeout on mount
  useEffect(() => {
    startHideTimeout();
    return clearHideTimeout;
  }, [startHideTimeout, clearHideTimeout]);

  // Show status bar only when mouse is at the very top
  useEffect(() => {
    let moveTimeout;
    
    const handleMouseMove = (e) => {
      // Only show status bar if mouse is in the top 10 pixels
      if (e.clientY < 10) {
        setIsVisible(true);
        clearHideTimeout();
        
        if (moveTimeout) {
          clearTimeout(moveTimeout);
        }
        
        moveTimeout = setTimeout(() => {
          if (!isMouseOverRef.current) {
            startHideTimeout();
          }
        }, 500);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (moveTimeout) {
        clearTimeout(moveTimeout);
      }
    };
  }, [clearHideTimeout, startHideTimeout]);

  return {
    isVisible,
    onMouseEnter,
    onMouseLeave
  };
}