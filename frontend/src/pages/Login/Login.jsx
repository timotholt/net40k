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
        {/* OAuth Login Buttons - retro-styled */}
        <div className={styles.oauthButtons}>
          <button
            type="button"
            className={styles.oauthButton + ' ' + styles.google}
            onClick={() => window.location.href = '/auth/google'}
          >
            <span className={styles.oauthIcon}>
              <svg width="24" height="24" viewBox="0 0 48 48">
                <g>
                  <path fill="#4285F4" d="M43.6 20.5h-18v7.1h10.4c-1.1 3-4.2 5.2-10.4 5.2-6.2 0-11.2-5-11.2-11.2s5-11.2 11.2-11.2c2.8 0 5.3 1 7.3 2.7l5.5-5.5C35.4 5.6 31.5 4 27 4 15.8 4 7 12.8 7 24s8.8 20 20 20c11.2 0 19.6-7.9 19.6-19.1 0-1.3-.1-2.3-.3-3.4z"/>
                  <path fill="#34A853" d="M6.9 14.7l5.8 4.3C14.7 15.2 20.3 11 27 11c2.8 0 5.3 1 7.3 2.7l5.5-5.5C35.4 5.6 31.5 4 27 4c-8.1 0-15 5.5-17.9 13.1z"/>
                  <path fill="#FBBC05" d="M27 44c4.3 0 8.2-1.4 11.2-3.8l-5.2-4.3c-1.6 1.1-3.7 1.8-6 1.8-6.2 0-11.4-5-11.4-11.2 0-1.7.4-3.3 1.1-4.7l-5.7-4.4C8.2 23.2 7 26.5 7 30c0 8.2 6.7 14 15 14z"/>
                  <path fill="#EA4335" d="M43.6 20.5h-18v7.1h10.4c-1.1 3-4.2 5.2-10.4 5.2-2.6 0-5-.8-6.8-2.2l-5.5 4.3C15.6 40.3 21 44 27 44c8.3 0 15-5.8 15-14 0-1.3-.1-2.3-.3-3.5z"/>
                </g>
              </svg>
            </span>
            Sign in with Google
          </button>
          <button
            type="button"
            className={styles.oauthButton + ' ' + styles.facebook}
            onClick={() => window.location.href = '/auth/facebook'}
          >
            <span className={styles.oauthIcon}>
              <svg width="24" height="24" viewBox="0 0 48 48">
                <g>
                  <rect fill="#1877F3" width="48" height="48" rx="8"/>
                  <path fill="#fff" d="M34 24h-5v14h-6V24h-4v-5h4v-3c0-3.3 2-5 5-5 1.4 0 2.6.1 3 .2v5h-2c-1.2 0-1.5.6-1.5 1.5v2.3h4.7l-.7 5z"/>
                </g>
              </svg>
            </span>
            Sign in with Facebook
          </button>
          <button
            type="button"
            className={styles.oauthButton + ' ' + styles.discord}
            onClick={() => window.location.href = '/auth/discord'}
          >
            <span className={styles.oauthIcon}>
              <svg width="24" height="24" viewBox="0 0 245 240">
                <g>
                  <path fill="#5865F2" d="M104.4 104.9c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1.1-6.1-4.5-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1s4.6 11.1 10.2 11.1c5.7 0 10.2-5 10.2-11.1s-4.5-11.1-10.2-11.1z"/>
                  <path fill="#5865F2" d="M222.6 0H22.4C10 0 0 10.1 0 22.6v194.9c0 12.5 10 22.6 22.4 22.6h167.3l-7.8-27.3 18.8 17.5 17.8 16.4V22.6C245 10.1 235 0 222.6 0zM81.1 163.4s-2.3-2.7-4.2-5.1c8.3-2.4 16.2-5.4 23.7-9.1 1.1-.6 2.1-1.2 3.1-1.8-22.8-6.5-31.4-20.7-31.4-20.7.6.4 1.2.8 1.8 1.2 13.2 9.1 25.7 13.1 38.5 13.1s25.3-4 38.5-13.1c.6-.4 1.2-.8 1.8-1.2 0 0-8.6 14.2-31.4 20.7 1 .6 2 1.2 3.1 1.8 7.5 3.7 15.4 6.7 23.7 9.1-1.9 2.4-4.2 5.1-4.2 5.1-13.1 4.1-26.9 4.1-40 0z"/>
                </g>
              </svg>
            </span>
            Sign in with Discord
          </button>
        </div>
        {/* Divider */}
        <div className={styles.oauthDivider}>
          <span>or sign in with username/password</span>
        </div>
        {/* Username/Password Fields and Rest of Form */}
        <>
          <>
            <h2>Login To Game Server</h2>
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
          </>
        </>
      </form>
    </div>
  );
}