import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';
import axiosInstance from '../api/axiosConfig';

// Helper function to safely get initial state
const getInitialState = () => {
  // Always return the same initial state structure
  return {
    user: null,
    isAuthenticated: false,
    status: 'idle',
    error: null
  };
};

// Initial state
const initialState = getInitialState();

// Async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      console.log('Auth: Attempting registration for user:', formData.username);
      const { data } = await axiosInstance.post(API_CONFIG.ENDPOINTS.REGISTER, {
        username: formData.username,
        nickname: formData.nickname,
        password: formData.password
      });

      console.log('Auth: Registration successful, received data:', data);
      return transformUserForRedux(data.user);
    } catch (error) {
      console.error('Auth: Registration error:', error);
      
      // Directly return the error message
      return rejectWithValue(error);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (updateData, { rejectWithValue }) => {
    try {
      console.log('Auth: Attempting to update profile');
      const { data } = await axiosInstance.patch('/users/me', updateData);
      
      console.log('Auth: Profile update successful:', data);
      return transformUserForRedux(data.user);
    } catch (error) {
      console.error('Auth: Profile update error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      console.log('Auth: Attempting login for user:', username);
      
      // Ensure we have a tab ID
      if (!window.name) {
        window.name = crypto.randomUUID();
        console.log('Auth: Generated new tab ID:', window.name);
      }

      const { data } = await axiosInstance.post(API_CONFIG.ENDPOINTS.LOGIN, {
        username,
        password
      });

      console.log('Auth: Login successful, received data:', data);

      // Store sessionToken with tab ID
      localStorage.setItem(`sessionToken_${window.name}`, data.sessionToken);
      localStorage.setItem(`user_${window.name}`, JSON.stringify(data.user));
      
      return transformUserForRedux(data.user);
    } catch (error) {
      console.error('Auth: Login error:', error);
      
      // Directly return the error message
      return rejectWithValue(error);
    }
  }
);

// Transforms a user object from the backend to a format suitable for the Redux store
const transformUserForRedux = (user) => {
  // Handle both formats: userUuid and id
  const userId = user.userUuid || user.id;
  
  return {
    id: userId,
    userUuid: userId, // Ensure both id and userUuid are set
    username: user.username,
    nickname: user.nickname,
    email: user.email,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    preferences: user.preferences || {},
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt
  };
};

// Log state changes
const logStateChange = (state, action) => {
  console.group('Auth State Change');
  console.log('Action:', action);
  console.log('Previous State:', {
    isAuthenticated: state.isAuthenticated,
    status: state.status,
    user: state.user ? { id: state.user.id, username: state.user.username } : null
  });
  console.groupEnd();
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Add debug logging for state changes
    logState: (state, action) => {
      console.log('Auth State:', {
        ...state,
        // Don't log the entire user object as it might be large
        user: state.user ? { id: state.user.id, username: state.user.username } : null
      });
    },
    setUser: (state, action) => {
      console.group('setUser');
      try {
        const previousState = { ...state };
        const transformedUser = action.payload ? transformUserForRedux(action.payload) : null;
        
        console.log('Setting user:', {
          action,
          payload: action.payload,
          transformedUser: transformedUser ? { 
            id: transformedUser.id, 
            username: transformedUser.username 
          } : null
        });
        
        state.user = transformedUser;
        state.isAuthenticated = !!action.payload;
        
        logStateChange(state, { 
          type: 'setUser',
          action,
          previousState,
          newState: { ...state }
        });
      } catch (error) {
        console.error('Error in setUser:', error);
        throw error;
      } finally {
        console.groupEnd();
      }
    },
    rehydrateAuth: (state) => {
      console.group('rehydrateAuth');
      try {
        // Log initial state
        console.log('Starting rehydration with state:', {
          isAuthenticated: state.isAuthenticated,
          status: state.status,
          user: state.user ? { id: state.user.id, username: state.user.username } : null
        });

        try {
          const tabId = window.name || 'default';
          console.log('Checking localStorage for user with tabId:', tabId);
          const storedUser = localStorage.getItem(`user_${tabId}`);
          
          if (storedUser) {
            console.log('Found stored user, parsing...');
            const parsedUser = JSON.parse(storedUser);
            console.log('Parsed user:', { 
              id: parsedUser.id || parsedUser.userUuid,
              username: parsedUser.username,
            });
            
            const transformedUser = transformUserForRedux(parsedUser);
            console.log('Transformed user:', { 
              id: transformedUser.id,
              username: transformedUser.username
            });
            
            console.log('Updating state with authenticated user');
            state.user = transformedUser;
            state.isAuthenticated = true;
            state.status = 'succeeded';
            
            console.log('Auth: Successfully rehydrated user from storage');
          } else {
            console.log('No stored user found in localStorage');
            state.user = null;
            state.isAuthenticated = false;
            state.status = 'idle';
          }
        } catch (storageError) {
          console.error('Error accessing localStorage:', storageError);
          // Don't throw, just continue with unauthenticated state
          state.user = null;
          state.isAuthenticated = false;
          state.status = 'idle';
        }
      } catch (error) {
        console.error('Unexpected error during rehydration:', error);
        state.user = null;
        state.isAuthenticated = false;
        state.status = 'idle';
      } finally {
        console.log('Rehydration completed. Final state:', {
          isAuthenticated: state.isAuthenticated,
          status: state.status,
          user: state.user ? { id: state.user.id } : null
        });
        console.groupEnd();
      }
    },
    logout: (state) => {
      console.log('logout called');
      state.user = null;
      state.isAuthenticated = false;
      state.status = 'idle';
      state.error = null;
      
      // Clear all tab-specific storage
      const tabId = window.name || 'default';
      localStorage.removeItem(`sessionToken_${tabId}`);
      localStorage.removeItem(`user_${tabId}`);
      
      // Also clear any old-style storage for backward compatibility
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
      state.status = 'idle';
    },
    resetAuthState: (state) => {
      state.error = null;
      state.status = 'idle';
      state.isAuthenticated = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Registration failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to update profile';
      });
  }
});

export const { setUser, logout, clearError, resetAuthState, rehydrateAuth } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectCurrentUser = selectUser; // Alias for consistency
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
