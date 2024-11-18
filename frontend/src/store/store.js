import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Configure the Redux store with our reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as needed
  },
});

export default store;
