import { useState, useEffect } from 'react';
import styles from './Tabs.module.css';
import { NicknameField } from '../../FormFields/NicknameField';
import IconDropdownField from '../../FormFields/IconDropdownField';
import { getChapterOptions } from '../../../utils/chapterUtils';
import { DEFAULT_CHAPTER } from 'shared/constants/GameConstants';

export default function ProfileTab({ userId }) {
  const [formData, setFormData] = useState({
    nickname: '',
    chapter: DEFAULT_CHAPTER,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chapterOptions, setChapterOptions] = useState([]);

  // Load chapter options
  useEffect(() => {
    setChapterOptions(getChapterOptions());
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous errors when user starts typing
    if (error) setError('');
  };

  const handleChapterChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      chapter: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Update nickname
      const nicknameResponse = await fetch('/api/user/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nickname: formData.nickname
        })
      });

      if (!nicknameResponse.ok) {
        const errorData = await nicknameResponse.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      // Update chapter preference
      const chapterResponse = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          preferences: { chapter: formData.chapter }
        })
      });

      if (!chapterResponse.ok) {
        const errorData = await chapterResponse.json();
        throw new Error(errorData.message || 'Failed to update chapter preference');
      }
      
      // Handle success - could show a success message here
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.content}>
        <section className={styles.section}>
          <h3>Personalization</h3>
          <form id="profileForm" onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nickname">Nickname</label>
              <NicknameField
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
              <label className={styles.label} htmlFor="chapter">Chapter</label>
              <IconDropdownField
                name="chapter"
                value={formData.chapter}
                onChange={handleChapterChange}
                options={chapterOptions}
                placeholder="Select your Chapter"
              />
            </div>
            
            {error && (
              <div className={styles.error} style={{ marginTop: '1rem' }}>
                {error}
              </div>
            )}
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