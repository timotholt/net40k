// This is an input contorl that can generate a random nickname using the Fantasy Name API

import React, { useState } from 'react';
import InputField from './InputField';
import styles from './FormFields.module.css';

export function NicknameField({ 
  label = 'Nickname', 
  name = 'nickname', 
  value, 
  onChange, 
  placeholder = 'Choose a Nickname',
  required = false,
  disabled = false,
  leftIcon = null
}) {
  // State to manage loading status during nickname generation
  const [isLoading, setIsLoading] = useState(false);

  //  Generates a random nickname from Fantasy Name API, 
  //  falls back to predefined list if API call fails
  const generateNickname = async () => {

    // Set loading state to prevent multiple simultaneous generations
    setIsLoading(true);

    try {
      // Attempt to fetch a random nickname from the API
      const response = await fetch(
        `https://fantasyname.lukewh.com/`
      );
      
      // Throw an error if the API response is not successful
      if (!response.ok) {
        throw new Error('Failed to fetch nickname');
      }

      // Extract the nickname from the response
      const nickname = await response.text();
      
      // Update the nickname using the provided onChange handler
      onChange({ target: { name, value: nickname.trim() } });
    } catch (error) {
      // Log any errors during nickname generation
      console.error('Nickname generation error:', error);

      // Predefined list of fallback nicknames
      const fallbackNicknames = [
        'Phantom',
        'Shadow',
        'Raven',
        'Storm',
        'Blade', 
        'Ghost',
        'Spark',
        'Frost',
        'Ember',
        'Hawk', 
        'Wolf',
        'Viper',
        'Titan',
        'Echo',
        'Nova'
      ];
      
      // Select a random nickname from the fallback list
      const fallbackNickname = 
        fallbackNicknames[
          Math.floor(Math.random() * fallbackNicknames.length)
        ];
      
      // Update with the fallback nickname
      onChange({ target: { name, value: fallbackNickname } });
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  };

  // Default nickname icon (user profile)
  const nicknameIcon = leftIcon || (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  );

  // Dice icon for random nickname generation
  // I got this from svgrepo.com
  const diceIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 8H8.01M8 12H8.01M16 12H16.01M16 8H16.01M16 16H16.01M8 16H8.01M7.2 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.71569 19.2843 4.40973 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40973 4.40973 4.71569 4.21799 5.09202C4 5.51984 4 6.07989 4 7.2V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.07989 20 7.2 20Z"/>
    </svg>
  );

  return (
    <div className={styles.nicknameFieldContainer}>
      <InputField
        label={label}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        leftIcon={nicknameIcon}
        // Render dice icon with click handler and loading state
        rightIcon={
          <div 
            onClick={generateNickname} 
            className={`${styles.icon} ${styles.rightIcon}`}
            style={{ 
              opacity: isLoading ? 0.5 : 1, 
              pointerEvents: isLoading ? 'none' : 'auto',
              cursor: 'pointer'
            }}
          >
            {diceIcon}
          </div>
        }
        required={required}
        disabled={disabled || isLoading}
      />
    </div>
  );
}
