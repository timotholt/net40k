import React from 'react';
import styles from '../SettingsModal.module.css';

export default function SecurityTab({ userId }) {
  // In a real app, this would come from an API
  const securityLogs = [
    { id: 1, event: 'Login', timestamp: new Date().toISOString(), ip: '192.168.1.1', location: 'Seattle, WA' },
    { id: 2, event: 'Password Changed', timestamp: new Date(Date.now() - 86400000).toISOString(), ip: '192.168.1.1', location: 'Seattle, WA' },
    { id: 3, event: 'Login', timestamp: new Date(Date.now() - 172800000).toISOString(), ip: '73.223.12.45', location: 'Portland, OR' },
  ];

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={styles.securityTab}>
      <h3>Security Logs</h3>
      <div className={styles.securityLogs}>
        {securityLogs.map(log => (
          <div key={log.id} className={styles.securityLogEntry}>
            <div className={styles.securityLogHeader}>
              <span className={styles.securityLogEvent}>{log.event}</span>
              <span className={styles.securityLogDate}>{formatDate(log.timestamp)}</span>
            </div>
            <div className={styles.securityLogDetails}>
              <span>IP: {log.ip}</span>
              <span>Location: {log.location}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
