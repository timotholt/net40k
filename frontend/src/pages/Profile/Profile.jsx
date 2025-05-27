import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  updateProfile, 
  selectCurrentUser, 
  selectAuthStatus, 
  selectAuthError, 
  resetAuthState 
} from '../../store/authSlice';
import InputField from '../../components/FormFields/InputField';
import PasswordField from '../../components/FormFields/PasswordField';
import { NicknameField } from '../../components/FormFields/NicknameField';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import SecondaryButton from '../../components/Buttons/SecondaryButton';
import styles from './Profile.module.css';

// Validation functions
const validateNickname = (value) => {
  if (!value) return 'Nickname is required';
  if (value.length < 2) return 'Nickname must be at least 2 characters';
  if (value.length > 30) return 'Nickname must be less than 30 characters';
  return '';
};

const validatePassword = (value) => {
  if (value && value.length > 0 && value.length < 8) return 'Password must be at least 8 characters';
  return '';
};

// Tab constants
const TABS = {
  PROFILE: 'profile',
  SECURITY: 'security',
  PREFERENCES: 'preferences'
};

export default function Profile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const status = useSelector(selectAuthStatus);
  const error = useSelector(selectAuthError);
  
  const [activeTab, setActiveTab] = useState(TABS.PROFILE);
  const [formData, setFormData] = useState({
    nickname: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar: ''
  });
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isIncomplete, setIsIncomplete] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        nickname: currentUser.nickname || currentUser.username || '',
        avatar: currentUser.avatar || ''
      }));
    }
  }, [currentUser]);

  // Handle tab changes from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && Object.values(TABS).includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name}`, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle tab changes
  const handleTabChange = (tab) => {
    console.log('Changing tab to:', tab);
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

  // Handle back to lobby
  const handleBackToLobby = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Navigating back to lobby');
    navigate('/lobby');
  };
  
  // Handle form submission with proper event handling
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Form submission initiated');
    handleSubmit(e);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    console.log('Form submission started');
    
    // Validate form
    const newErrors = {};
    
    // Always validate nickname if it's being shown
    if (activeTab === TABS.PROFILE) {
      const nicknameError = validateNickname(formData.nickname);
      if (nicknameError) newErrors.nickname = nicknameError;
    }
    
    // Validate password fields if they're being changed
    if (activeTab === TABS.SECURITY && formData.newPassword) {
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) newErrors.newPassword = passwordError;
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }
    
    try {
      // Prepare update data based on active tab
      const updateData = {};
      
      if (activeTab === TABS.PROFILE) {
        if (formData.nickname !== currentUser?.nickname) {
          updateData.nickname = formData.nickname;
        }
        if (formData.avatar !== currentUser?.avatar) {
          updateData.avatar = formData.avatar;
        }
      } else if (activeTab === TABS.SECURITY && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      console.log('Update data:', updateData);
      
      // Only dispatch if there are changes
      if (Object.keys(updateData).length > 0) {
        console.log('Dispatching updateProfile with:', updateData);
        const resultAction = await dispatch(updateProfile(updateData));
        
        if (updateProfile.fulfilled.match(resultAction)) {
          console.log('Profile update successful');
          setSuccessMessage('Profile updated successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage('');
            
            // Clear password fields after successful update
            if (activeTab === TABS.SECURITY) {
              setFormData(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
              }));
            }
          }, 3000);
        }
      } else {
        console.log('No changes detected, skipping update');
        setSuccessMessage('No changes to save');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      // Error is handled by the rejected action in the slice
    }
  };

  // Handle random nickname generation
  const handleRandomNickname = () => {
    const randomNick = `User${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData(prev => ({
      ...prev,
      nickname: randomNick
    }));
    
    // Clear any existing nickname error
    if (errors.nickname) {
      setErrors(prev => ({
        ...prev,
        nickname: ''
      }));
    }
  };
  
  // Check for incomplete profile on initial load
  useEffect(() => {
    if (searchParams.get('incomplete') === 'true') {
      setIsIncomplete(true);
      setSuccessMessage('Please complete your profile to continue');
    }
  }, [searchParams]);

  // Render the profile tab content
  const renderProfileTab = () => (
    <div className={styles.tabContent}>
      <NicknameField
        label="Nickname"
        name="nickname"
        value={formData.nickname}
        onChange={handleChange}
        onRandomize={handleRandomNickname}
        error={errors.nickname}
        placeholder="Enter a nickname"
      />
      
      <InputField
        label="Avatar URL (optional)"
        name="avatar"
        type="url"
        value={formData.avatar}
        onChange={handleChange}
        placeholder="https://example.com/avatar.jpg"
      />
      
      {formData.avatar && (
        <div className={styles.avatarPreview}>
          <p>Preview:</p>
          <img 
            src={formData.avatar} 
            alt="Avatar preview" 
            className={styles.avatarImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/default-avatar.png';
            }}
          />
        </div>
      )}
    </div>
  );

  // Render the security tab content
  const renderSecurityTab = () => (
    <div className={styles.tabContent}>
      <PasswordField
        label="Current Password"
        name="currentPassword"
        value={formData.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
        placeholder="Enter your current password"
      />
      
      <PasswordField
        label="New Password"
        name="newPassword"
        value={formData.newPassword}
        onChange={handleChange}
        error={errors.newPassword}
        placeholder="Enter a new password"
      />
      
      <PasswordField
        label="Confirm New Password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        placeholder="Confirm your new password"
      />
      
      <div className={styles.passwordRequirements}>
        <p>Password must be at least 8 characters long.</p>
      </div>
    </div>
  );

  // Render the preferences tab content
  const renderPreferencesTab = () => (
    <div className={styles.tabContent}>
      <p>Preferences coming soon!</p>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div 
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !isIncomplete && navigate('/lobby')}
      >
        <motion.div 
          className={styles.modal}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h2>{isIncomplete ? 'Complete Your Profile' : 'Profile Settings'}</h2>
          </div>
          
          {isIncomplete && (
            <div className={styles.alert}>
              Please complete your profile to access all features
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className={styles.success}>
              {successMessage}
            </div>
          )}
          
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === TABS.PROFILE ? styles.activeTab : ''}`}
              onClick={() => handleTabChange(TABS.PROFILE)}
            >
              Profile
            </button>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === TABS.SECURITY ? styles.activeTab : ''}`}
              onClick={() => handleTabChange(TABS.SECURITY)}
              disabled={isIncomplete}
              title={isIncomplete ? 'Complete your profile first' : ''}
            >
              Security
            </button>
          </div>
          
          <form onSubmit={handleFormSubmit} className={styles.form}>
            {activeTab === TABS.PROFILE && renderProfileTab()}
            {activeTab === TABS.SECURITY && renderSecurityTab()}
            
            <div className={styles.buttonGroup}>
              {!isIncomplete && (
                <SecondaryButton 
                  onClick={handleBackToLobby}
                >
                  Back to Lobby
                </SecondaryButton>
              )}
              
              <PrimaryButton 
                type="submit"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
