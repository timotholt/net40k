import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
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

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
      
      // Only dispatch if there are changes
      if (Object.keys(updateData).length > 0) {
        const resultAction = await dispatch(updateProfile(updateData));
        
        if (updateProfile.fulfilled.match(resultAction)) {
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
    
    // Check if redirected due to incomplete profile
    if (searchParams.get('incomplete') === 'true') {
      setIsIncomplete(true);
      setSuccessMessage('Please complete your profile to continue');
    }
    
    return () => {
      dispatch(resetAuthState());
    };
  }, [currentUser, searchParams, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleNicknameRandomize = (randomNickname) => {
    setFormData(prev => ({
      ...prev,
      nickname: randomNickname
    }));
    
    if (errors.nickname) {
      setErrors(prev => ({
        ...prev,
        nickname: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (activeTab === TABS.PROFILE) {
      const nicknameError = validateNickname(formData.nickname);
      if (nicknameError) newErrors.nickname = nicknameError;
    }
    
    if (activeTab === TABS.SECURITY && (formData.newPassword || formData.confirmPassword)) {
      if (formData.newPassword && !formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (formData.newPassword) {
        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) newErrors.newPassword = passwordError;
        
        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const updateData = {};
      
      if (activeTab === TABS.PROFILE) {
        updateData.nickname = formData.nickname;
        updateData.avatar = formData.avatar;
      } 
      
      if (activeTab === TABS.SECURITY && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      await dispatch(updateProfile(updateData)).unwrap();
      
      setSuccessMessage('Profile updated successfully!');
      
      // Clear password fields after successful update
      if (activeTab === TABS.SECURITY) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
      
      // If profile was incomplete and now complete, redirect to lobby
      if (isIncomplete && activeTab === TABS.PROFILE) {
        setTimeout(() => navigate('/lobby'), 1500);
      }
      
    } catch (error) {
      console.error('Profile update failed:', error);
      setErrors(prev => ({
        ...prev,
        form: error.message || 'Failed to update profile'
      }));
    }
  };

  const renderProfileTab = () => (
    <>
      <div className={styles.formGroup}>
        <label>Username</label>
        <input 
          type="text" 
          value={currentUser?.username || ''} 
          disabled 
          className={styles.disabledInput}
        />
      </div>
      
      <NicknameField
        value={formData.nickname}
        onChange={handleChange}
        onRandomize={handleNicknameRandomize}
        error={errors.nickname}
      />
      
      <div className={styles.formGroup}>
        <label>Avatar URL</label>
        <InputField
          type="text"
          name="avatar"
          value={formData.avatar}
          onChange={handleChange}
          placeholder="Enter avatar URL"
          error={errors.avatar}
        />
        {formData.avatar && (
          <div className={styles.avatarPreview}>
            <img src={formData.avatar} alt="Avatar preview" onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}
      </div>
    </>
  );

  const renderSecurityTab = () => (
    <>
      <PasswordField
        label="Current Password"
        name="currentPassword"
        value={formData.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
        placeholder="Enter current password"
      />
      
      <PasswordField
        label="New Password"
        name="newPassword"
        value={formData.newPassword}
        onChange={handleChange}
        error={errors.newPassword}
        placeholder="Leave empty to keep current password"
      />
      
      {formData.newPassword && (
        <PasswordField
          label="Confirm New Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          placeholder="Confirm new password"
        />
      )}
    </>
  );

  const renderPreferencesTab = () => (
    <div className={styles.preferences}>
      <h3>Preferences</h3>
      <p>User preferences will go here.</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className={styles.title}>Profile Settings</h1>
        
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
          >
            Security
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === TABS.PREFERENCES ? styles.activeTab : ''}`}
            onClick={() => handleTabChange(TABS.PREFERENCES)}
          >
            Preferences
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {activeTab === TABS.PROFILE && renderProfileTab()}
          {activeTab === TABS.SECURITY && renderSecurityTab()}
          {activeTab === TABS.PREFERENCES && renderPreferencesTab()}
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Saving...' : 'Save Changes'}
          </button>
                type="button" 
                className={styles.secondaryButton}
                onClick={() => navigate('/lobby')}
              >
                Back to Lobby
              </button>
            )}
            <button 
              type="submit" 
              className={styles.primaryButton}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
