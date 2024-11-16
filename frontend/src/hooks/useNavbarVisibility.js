import { useState, useCallback, useRef, useEffect } from 'react';

export function useNavbarVisibility(hideDelay = 2000) {
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

  // Show navbar on mouse move
  useEffect(() => {
    let moveTimeout;
    
    const handleMouseMove = (e) => {
      // Only show navbar if mouse is near the top of the screen
      if (e.clientY < 100) {
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