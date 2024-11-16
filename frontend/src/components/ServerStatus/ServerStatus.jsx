import { useState, useEffect } from 'react';
import styles from './ServerStatus.module.css';

export default function ServerStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Add your server status check logic here
    const checkServerStatus = () => {
      // Implement your server status check
    };

    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <div className={styles.serverStatus}>
      <div className={styles.statusMessage}>
        Server connection lost. Retrying...
        <button onClick={() => window.location.reload()}>
          Reload Now
        </button>
      </div>
    </div>
  );
}