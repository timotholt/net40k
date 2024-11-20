import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../../store/authSlice';
import { InputField, PasswordField } from '../../components/FormFields';
import { validation } from '../../utils/validation';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  // Clear the success message from location state after displaying it
  useEffect(() => {
    if (location.state?.message) {
      // Clear the message from location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.message]);

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
        window.alert(result.payload);
        
        setErrors({
          form: result.payload
        });
        return;
      }
      
      console.log('Login successful');
      // Remove direct navigation, let ProtectedRoute handle it
    } catch (error) {
      console.log('Unexpected error:', error);
      window.alert('Login failed');
      
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
      <form 
        onSubmit={handleSubmit} 
        className={styles.loginForm}
        method="post"
      >
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

        <div className={styles.messageContainer}>
          {successMessage && (
            <div className={styles.message + ' ' + styles.success}>
              {successMessage}
            </div>
          )}
          {(errors.form || errors.username || errors.password) && (
            <div className={styles.message + ' ' + styles.error}>
              {errors.form || errors.username || errors.password}
            </div>
          )}
        </div>

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
      </form>
    </div>
  );
}