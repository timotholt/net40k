import { useState, useEffect } from 'react';
import styles from './Tabs.module.css';
import { NicknameField } from '../../FormFields/NicknameField';
import IconDropdownField from '../../FormFields/IconDropdownField';
import { getChapterOptions } from '../../../utils/chapterUtils';
import { DEFAULT_CHAPTER } from 'shared/constants/GameConstants';
import { getSpaceMarineClassIconStyle } from '../../../utils/svgUtils';

// Space Marine class icons with consistent styling
const SpaceMarineIcons = {
  command: (
    <div style={{ marginRight: '1rem' }}>
      <img 
        src="/icons/imperium/Adeptus Astartes [Imperium, Space Marines].svg" 
        alt="Command" 
        style={{ ...getSpaceMarineClassIconStyle('command'), filter: 'invert(57%) sepia(90%) saturate(383%) hue-rotate(53deg) brightness(91%) contrast(91%)' }} 
      />
    </div>
  ),
  apothecary: (
    <div style={{ marginRight: '1rem' }}>
      <img 
        src="/icons/imperium/apothecarium-02.svg" 
        alt="Apothecary" 
        style={{ ...getSpaceMarineClassIconStyle('apothecary'), filter: 'invert(57%) sepia(90%) saturate(383%) hue-rotate(53deg) brightness(91%) contrast(91%)' }} 
      />
    </div>
  ),
  chaplain: (
    <div style={{ marginRight: '1rem' }}>
      <img 
        src="/icons/imperium/chaplain.svg" 
        alt="Chaplain" 
        style={{ ...getSpaceMarineClassIconStyle('chaplain'), filter: 'invert(57%) sepia(90%) saturate(383%) hue-rotate(53deg) brightness(91%) contrast(91%)' }} 
      />
    </div>
  ),
  librarian: (
    <div style={{ marginRight: '1rem' }}>
      <img 
        src="/icons/imperium/librarius-01.svg" 
        alt="Librarian" 
        style={{ ...getSpaceMarineClassIconStyle('librarian'), filter: 'invert(57%) sepia(90%) saturate(383%) hue-rotate(53deg) brightness(91%) contrast(91%)' }} 
      />
    </div>
  ),
  techmarine: (
    <div style={{ marginRight: '1rem' }}>
      <img 
        src="/icons/imperium/Adeptus%20Mechanicus%20%5BImperium%5D.svg" 
        alt="Techmarine" 
        style={{ ...getSpaceMarineClassIconStyle('techmarine'), filter: 'invert(57%) sepia(90%) saturate(383%) hue-rotate(53deg) brightness(91%) contrast(91%)' }} 
      />
    </div>
  ),
};

export default function ProfileTab({ userId }) {
  const [formData, setFormData] = useState({
    nickname: '',
    chapter: DEFAULT_CHAPTER,
    spaceMarineClass: 'command' // Default to Command
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

  const handleSpaceMarineClassChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      spaceMarineClass: value
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
              <NicknameField
                name="nickname"
                value={formData.nickname}
                onChange={handleInputChange}
                required
                label="Nickname"
              />
            </div>
            
            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
              <label className={styles.label} htmlFor="chapter">Favorite Chapter</label>
              <IconDropdownField
                name="chapter"
                value={formData.chapter}
                onChange={handleChapterChange}
                options={chapterOptions}
                placeholder="Select your Chapter"
              />
            </div>
            
            <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
              <label className={styles.label} htmlFor="spaceMarineClass">Favorite Class</label>
              <IconDropdownField
                name="spaceMarineClass"
                value={formData.spaceMarineClass}
                onChange={handleSpaceMarineClassChange}
                options={[
                  { 
                    value: 'command', 
                    label: 'Command', 
                    icon: SpaceMarineIcons.command
                  },
                  { 
                    value: 'apothecary', 
                    label: 'Apothecary', 
                    icon: SpaceMarineIcons.apothecary
                  },
                  { 
                    value: 'chaplain', 
                    label: 'Chaplain', 
                    icon: SpaceMarineIcons.chaplain
                  },
                  { 
                    value: 'librarian', 
                    label: 'Librarian', 
                    icon: SpaceMarineIcons.librarian
                  },
                  { 
                    value: 'techmarine', 
                    label: 'Techmarine', 
                    icon: SpaceMarineIcons.techmarine
                  }
                ]}
                leftIcon={SpaceMarineIcons[formData.spaceMarineClass] || SpaceMarineIcons.command}
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