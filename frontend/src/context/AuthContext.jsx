import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG, buildApiUrl } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tabId, setTabId] = useState('');
  const navigate = useNavigate();

  // Initialize tab ID in useEffect
  useEffect(() => {
    if (!window.name) {
      window.name = crypto.randomUUID();
    }
    setTabId(window.name);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (!tabId) return; // Don't check until we have a tabId

    const storedUser = localStorage.getItem(`user_${tabId}`);
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);
    }
  }, [tabId]);

  const login = async (username, password) => {
    console.log('AuthContext: Attempting login for user:', username);
    try {
      const loginUrl = buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN);
      console.log('Login URL:', loginUrl);

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        console.error('AuthContext: Login failed with status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(`Login failed: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      console.log('AuthContext: Login successful, received data:', data);
      console.log('AuthContext: Session token from response:', data.sessionToken);
      console.log('AuthContext: Current tab ID:', tabId);

      const userData = {
        id: data.user.userId,
        username: data.user.username,
        nickname: data.user.nickname || data.user.username,
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem(`user_${tabId}`, JSON.stringify(userData));
      localStorage.setItem(`sessionToken_${tabId}`, data.sessionToken);
      console.log('AuthContext: Stored session token with key:', `sessionToken_${tabId}`);
      
      return data;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logging out user');
    setUser(null);
    setIsAuthenticated(false);
    if (tabId) {
      localStorage.removeItem(`user_${tabId}`);
      localStorage.removeItem(`sessionToken_${tabId}`);
    }
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      isAuthenticated,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}