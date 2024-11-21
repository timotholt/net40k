import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthContext } from '../context/AuthContext';

/**
 * Custom hook for polling a list of rooms
 * @param {Function} fetchRoomsFn - Async function to fetch rooms list
 * @param {Object} options - Polling configuration options
 */
export function useRoomPolling(fetchRoomsFn, options = {}) {
  const {
    interval = 5000,
    enabled = true,
    onError = console.error,
    immediate = true,
    maxRetries = 3
  } = options;

  const { isTokenValid } = useAuthContext();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const pollingTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  const fetchRoomsList = useCallback(async () => {
    // Stop polling if token is invalid or component is unmounted
    if (!isMountedRef.current || !enabled || !isTokenValid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRoomsFn();
      if (isMountedRef.current) {
        setRooms(result || []);
        setRetryCount(0);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err);
        onError(err);

        // Implement retry mechanism
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
        } else {
          stopPolling();
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    fetchRoomsFn, 
    enabled, 
    isTokenValid, 
    onError, 
    maxRetries, 
    retryCount, 
    stopPolling
  ]);

  const startPolling = useCallback(() => {
    const poll = () => {
      fetchRoomsList().then(() => {
        if (isMountedRef.current && enabled && isTokenValid) {
          pollingTimeoutRef.current = setTimeout(poll, interval);
        }
      });
    };

    // Initial fetch if immediate is true
    if (immediate) {
      fetchRoomsList();
    }

    // Start polling
    poll();
  }, [fetchRoomsList, interval, immediate, enabled, isTokenValid]);

  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && isTokenValid) {
      startPolling();
    }

    return () => {
      isMountedRef.current = false;
      stopPolling();
    };
  }, [enabled, isTokenValid, startPolling, stopPolling]);

  return {
    rooms,
    loading,
    error,
    stopPolling,
    startPolling,
    retryCount
  };
}