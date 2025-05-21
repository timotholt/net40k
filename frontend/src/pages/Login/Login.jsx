import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, selectIsAuthenticated, selectAuthError, resetAuthState } from '../../store/authSlice';
import { InputField, PasswordField } from '../../components/FormFields';
import { validation } from '../../utils/validation';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  // Navigate to lobby when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/lobby');
    }
  }, [isAuthenticated, navigate]);

  // Clear the success message from location state after displaying it
  useEffect(() => {
    if (location.state?.message) {
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.message]);

  useEffect(() => {
    dispatch(resetAuthState());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear all errors and success message when user starts typing
    setErrors({});
    setSuccessMessage('');
  };

  const validateForm = () => {
    console.log('Validating form...');
    console.log('Current values:', formData);
    
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!validation.username.pattern.test(formData.username)) {
      newErrors.username = validation.username.message;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validation.password.pattern.test(formData.password)) {
      newErrors.password = validation.password.message;
    }

    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsLoading(true);
    try {
      const result = await dispatch(loginUser({ username: formData.username, password: formData.password }));
      
      // Check if the login was unsuccessful
      if (result.type.includes('rejected')) {
        // window.alert(result.payload);
        
        setErrors({
          form: result.payload
        });
        return;
      }
      
      console.log('Login successful');
      // Remove direct navigation, let ProtectedRoute handle it
    } catch (error) {
      console.log('Unexpected error:', error);
      
      setErrors({
        form: 'Login failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  return (
    <div className={styles.loginContainer}>
      {/* All login UI is now inside a single retro-styled form */}
      <form 
        onSubmit={handleSubmit} 
        className={styles.loginForm}
        method="post"
      >
        <h2>Login to Game Server</h2>

        {/* Username/Password Fields */}
        <div className={styles.credentialsSection}>
          <InputField
            type="text"
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            }
          />
          <PasswordField
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </div>

        {/* Divider */}
        <div className={styles.oauthDivider}>
          <span>or sign in with</span>
        </div>

        {/* OAuth Login Buttons */}
        <div className={styles.oauthButtons}>
          <button
            type="button"
            className={styles.loginButton}
            onClick={() => window.location.href = '/auth/google'}
          >
            <span className={styles.oauthIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M21.35 11.1h-9.17v2.73h6.51c-0.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-0.15-1.81-0.15-1.81z"/>
              </svg>
            </span>
            Google
          </button>
          <button
            type="button"
            className={styles.loginButton}
            onClick={() => window.location.href = '/auth/facebook'}
          >
            <span className={styles.oauthIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M20.9 2H3.1A1.1 1.1 0 0 0 2 3.1v17.8A1.1 1.1 0 0 0 3.1 22h9.58v-7.75h-2.6v-3h2.6V9a3.64 3.64 0 0 1 3.88-4 20.26 20.26 0 0 1 2.33.12v2.7H17.3c-1.26 0-1.5.6-1.5 1.47v1.93h3l-.39 3H15.8V22h5.1a1.1 1.1 0 0 0 1.1-1.1V3.1A1.1 1.1 0 0 0 20.9 2z"/>
              </svg>
            </span>
            Facebook
          </button>
          <button
            type="button"
            className={styles.loginButton}
            onClick={() => window.location.href = '/auth/discord'}
          >
            <span className={styles.oauthIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z"/>
              </svg>
            </span>
            Discord
          </button>
          <button
            className={styles.loginButton}
            type="button"
            onClick={() => window.location.href = '/auth/steam'}
          >
            <span className={styles.oauthIcon}>
              <svg viewBox="0 0 24 24">
                <path d="M12 0C5.6 0 0.4 4.8 0 10.8L6.4 13.2C6.8 12.8 7.6 12.4 8.4 12.4L11.6 8.4C11.6 6 13.6 4 16 4C18.4 4 20.4 6 20.4 8.4C20.4 10.8 18.4 12.8 16 12.8L12 16C12 16.8 11.6 17.2 11.2 17.6L13.6 24C19.6 23.6 24 18.4 24 12C24 5.2 18.8 0 12 0ZM7.6 20L5.2 19.2C5.6 20 6.4 20.4 7.2 20.4C8.4 20.4 9.6 19.6 9.6 18C9.6 16.4 8.4 15.6 7.2 15.6C6.8 15.6 6.4 15.6 6 16L8.4 16.8C9.2 17.2 9.6 18 9.2 19.2C9.2 19.6 8.4 20 7.6 20Z"/>
              </svg>
            </span>
            Steam
          </button>
        </div>

        <div className={styles.registerPrompt}>
          <p>
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={handleRegisterClick} 
              className={styles.registerLink}
            >
              Register
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}