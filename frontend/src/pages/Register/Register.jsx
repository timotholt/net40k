import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { registerUser, selectAuthError, selectAuthStatus } from '../../store/authSlice';
import InputField from '../../components/FormFields/InputField';
import PasswordField from '../../components/FormFields/PasswordField';
import styles from './Register.module.css';

const validateUsername = (value) => {
  if (!value) return 'Username is required';
  if (value.length < 3) return 'Username must be at least 3 characters';
  if (value.length > 20) return 'Username must be less than 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
  return '';
};

const validateNickname = (value) => {
  if (!value) return 'Nickname is required';
  if (value.length < 2) return 'Nickname must be at least 2 characters';
  if (value.length > 30) return 'Nickname must be less than 30 characters';
  return '';
};

const validatePassword = (value) => {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  return '';
};

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const status = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);

  const isLoading = status === 'loading';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const nicknameError = validateNickname(formData.nickname);
    const passwordError = validatePassword(formData.password);

    if (usernameError || nicknameError || passwordError) {
      setError(usernameError || nicknameError || passwordError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await dispatch(registerUser(formData)).unwrap();
      navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
    } catch (err) {
      console.log('Component Catch Block Error:', {
        type: typeof err,
        keys: Object.keys(err),
        message: err.message,
        name: err.name,
        stringValue: String(err),
        fullError: err,
        toString: err.toString ? err.toString() : 'No toString method'
      });
      
      // Attempt to extract error message from different possible locations
      const errorMessage = 
        err.message || 
        err.response?.data?.message || 
        err.response?.data?.error || 
        String(err) || 
        'Registration failed. Please try again.';
      
      setError(errorMessage);
    }
  };

  const userIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );

  const nicknameIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    </svg>
  );

  return (
    <motion.div
      className={styles.registerContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <h2>Register</h2>

        <InputField
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          leftIcon={userIcon}
          required
          validate={validateUsername}
          disabled={isLoading}
        />

        <InputField
          label="Nickname"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
          leftIcon={nicknameIcon}
          required
          validate={validateNickname}
          disabled={isLoading}
        />

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          validate={validatePassword}
          disabled={isLoading}
        />

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          validate={validatePassword}
          disabled={isLoading}
        />

        {(error || authError) && (
          <div className={styles.error}>
            {error || authError}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.registerButton}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>

        <div className={styles.links}>
          <Link to="/" className={styles.loginLink}>
            Already have an account? Login
          </Link>
        </div>
      </form>
    </motion.div>
  );
}