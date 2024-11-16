import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
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
  const { login } = useAuth();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      login(data);
      navigate('/lobby');
    } catch (err) {
      setError('Registration failed. Please try again.');
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
        />

        <InputField
          label="Nickname"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
          leftIcon={nicknameIcon}
          required
          validate={validateNickname}
        />

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          validate={validatePassword}
        />

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          validate={validatePassword}
        />

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" className={styles.registerButton}>
          Register
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