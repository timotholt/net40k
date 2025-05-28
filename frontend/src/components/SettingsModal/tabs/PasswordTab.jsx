import { useState } from 'react';
import styles from './Tabs.module.css';
import PasswordField from '../../FormFields/PasswordField';

export default function PasswordTab({ userId }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) throw new Error('Failed to change password');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Failed to change password');
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Change Password</h3>
          <form id="passwordForm" onSubmit={handleChangePassword}>
            <div className={styles.formGroup}>
              <PasswordField
                label="Current Password"
                name="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <PasswordField
                label="New Password"
                name="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <PasswordField
                label="Confirm New Password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
          </form>
        </section>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <button type="submit" form="passwordForm" className={styles.button}>
            Save Changes
          </button>
          <p className={styles.note}>
            Note: Passwords are saved on the server
          </p>
        </div>
      </div>
    </div>
  );
}