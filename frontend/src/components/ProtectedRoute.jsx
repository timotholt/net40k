import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAuthStatus, selectUser } from '../store/authSlice';
import { useEffect, useState } from 'react';

// Protected Route component that checks Redux auth state
export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authStatus = useSelector(selectAuthStatus);
  const user = useSelector(selectUser);
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Debug logging for auth state changes
  useEffect(() => {
    console.group('ProtectedRoute - Auth State');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('authStatus:', authStatus);
    console.log('user:', user ? { id: user.id, username: user.username } : null);
    console.log('pathname:', location.pathname);
    console.log('isCheckingAuth:', isCheckingAuth);
    console.log('timestamp:', new Date().toISOString());
    console.groupEnd();
  }, [isAuthenticated, authStatus, user, location.pathname, isCheckingAuth]);

  // Wait for auth check to complete
  useEffect(() => {
    // If we're not in a loading state, we can proceed
    if (authStatus !== 'loading') {
      console.log('Auth check complete, setting isCheckingAuth to false');
      setIsCheckingAuth(false);
    } else {
      console.log('Auth check in progress...');
    }
  }, [authStatus]);

  // Show loading state while checking auth
  if (isCheckingAuth) {
    console.log('ProtectedRoute: Checking auth status...');
    return <div>Loading...</div>; // Or your preferred loading component
  }

  // If not authenticated, redirect to login with the return URL
  if (!isAuthenticated) {
    // Don't redirect if we're already on the login/register page
    const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);
    
    if (!isAuthPage) {
      console.log('ProtectedRoute: Not authenticated, redirecting to login');
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  } else {
    // If authenticated but trying to access login/register, redirect to lobby
    const isAuthPage = ['/', '/login', '/register'].includes(location.pathname);
    if (isAuthPage) {
      console.log('ProtectedRoute: Already authenticated, redirecting to lobby');
      return <Navigate to="/lobby" replace />;
    }
  }

  // If we get here, the user is authenticated and trying to access a protected route
  console.log('ProtectedRoute: Rendering protected content for path:', location.pathname);
  return <Outlet />;
}