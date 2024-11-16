import { useState } from 'react';
import styles from './Tabs.module.css';

export default function ProfileTab({ userId }) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/user/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nickname
        })
      });

      if (!response.ok) throw new Error('Failed to update nickname');
      
      // Handle success
    } catch (err) {
      setError('Failed to update nickname');
    }
  };

  return (
    <div className={styles.tabPanel}>
      <section className={styles.section}>
        <h3>Personalization</h3>
        <form onSubmit={handleUpdateNickname}>
          <div className={styles.formGroup}>
            <label>Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          
          <button type="submit" className={styles.button}>
            Update Nickname
          </button>
        </form>
      </section>
    </div>
  );
}