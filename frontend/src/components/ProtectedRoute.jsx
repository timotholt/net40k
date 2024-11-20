import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';

// Protected Route component that checks Redux auth state
export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}