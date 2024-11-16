import { useState } from 'react';
import styles from './Tabs.module.css';

export default function AccountTab({ userId }) {
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete account');
      
      // Handle logout and redirect
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  return (
    <div className={styles.tabPanel}>
      <section className={styles.section}>
        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <div className={styles.formGroup}>
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          
          <button type="submit" className={styles.button}>
            Change Password
          </button>
        </form>
      </section>

      <section className={styles.section}>
        <h3>Danger Zone</h3>
        <button
          onClick={handleDeleteAccount}
          className={styles.deleteButton}
        >
          Delete Account
        </button>
      </section>
    </div>
  );
}