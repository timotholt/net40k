import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_CONFIG } from '../config/api';
import axiosInstance from '../api/axiosConfig';

// Initial state matches current AuthContext state
const initialState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
  error: null
};

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

      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return transformUserForRedux(data.user);
    } catch (error) {
      console.error('Auth: Registration error:', error);
      
      // Log full error details
      console.log('Full Error Details:', {
        error: error,
        name: error.name,
        message: error.message,
        response: error.response
      });

     // Simplify error handling by directly returning error message
     return rejectWithValue(error.message || 'Registration failed');
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      console.log('Auth: Attempting login for user:', username);
      const { data } = await axiosInstance.post(API_CONFIG.ENDPOINTS.LOGIN, {
        username,
        password
      });

      console.log('Auth: Login successful, received data:', data);

      // Store token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      return transformUserForRedux(data.user);
    } catch (error) {
      console.error('Auth: Login error:', error);
      
      // Log full error details
      console.log('Full Error Details:', {
        error: error,
        name: error.name,
        message: error.message,
        response: error.response
      });

      // Simplify error handling by directly returning error message
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

// Transforms a user object from the backend to a format suitable for the Redux store
const transformUserForRedux = (user) => ({
  id: user.userUuid,
  username: user.username,
  nickname: user.nickname,
  email: user.email,
  isAdmin: user.isAdmin,
  isActive: user.isActive,
  preferences: user.preferences,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Use the same transformation for consistency
      state.user = transformUserForRedux(action.payload);
      state.isAuthenticated = !!action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
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
      // Register cases
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
        state.error = action.payload;
      })
      // Login cases
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
        state.error = action.payload;
      });
  }
});

export const { setUser, logout, clearError, resetAuthState } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
