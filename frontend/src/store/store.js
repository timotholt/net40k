import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Configure the Redux store with our reducers
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as needed
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    })
});

// Debug logging
let previousState = store.getState();
store.subscribe(() => {
  const currentState = store.getState();
  
  // Only log if auth state changed
  if (previousState.auth !== currentState.auth) {
    console.group('Auth State Changed');
    console.log('Previous auth state:', previousState.auth);
    console.log('Current auth state:', currentState.auth);
    console.groupEnd();
  }
  
  previousState = currentState;
});

export default store;
