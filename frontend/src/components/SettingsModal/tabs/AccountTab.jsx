import React from 'react';
import styles from '../SettingsModal.module.css';

export default function AccountTab({ userId }) {
  // In a real app, this would come from an API
  const accountInfo = {
    facebookId: 'Not connected',
    googleId: 'Not connected',
    discordId: 'Not connected',
    steamId: 'Not connected',
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      console.log('Deleting account:', userId);
    }
  };

  return (
    <div className={styles.accountTab}>
      <div className={styles.formGroup}>
        <label>Facebook ID</label>
        <input 
          type="text" 
          value={accountInfo.facebookId} 
          readOnly 
          className={styles.readOnlyInput}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Google ID</label>
        <input 
          type="text" 
          value={accountInfo.googleId} 
          readOnly 
          className={styles.readOnlyInput}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Discord ID</label>
        <input 
          type="text" 
          value={accountInfo.discordId} 
          readOnly 
          className={styles.readOnlyInput}
        />
      </div>
      
      <div className={styles.formGroup}>
        <label>Steam ID</label>
        <input 
          type="text" 
          value={accountInfo.steamId} 
          readOnly 
          className={styles.readOnlyInput}
        />
      </div>
      
      <div className={styles.formActions}>
        <button 
          onClick={handleDeleteAccount}
          className={styles.deleteButton}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
