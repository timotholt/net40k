import { useState } from 'react';
import styles from './Tabs.module.css';
import { NicknameField } from '../../FormFields/NicknameField';

export default function ProfileTab({ userId }) {
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNicknameChange = (e) => {
    setNickname(e.target.value);
    // Clear any previous errors when user starts typing
    if (error) setError('');
  };

  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nickname
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update nickname');
      }
      
      // Handle success - could show a success message here
    } catch (err) {
      console.error('Update nickname error:', err);
      setError(err.message || 'Failed to update nickname');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Personalization</h3>
          <form id="profileForm" onSubmit={handleUpdateNickname}>
            <div className={styles.formGroup}>
              <NicknameField
                value={nickname}
                onChange={handleNicknameChange}
                required
              />
              {error && <div className={styles.error} style={{ marginTop: '0.5rem' }}>{error}</div>}
            </div>
          </form>
        </section>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <button 
            type="submit" 
            form="profileForm" 
            className={styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <p className={styles.note}>
            Note: Profile settings are saved on the server
          </p>
        </div>
      </div>
    </div>
  );
}