import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../store/authSlice';

// Protected Route component that checks Redux auth state
function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  
  return isAuthenticated ? children : <Navigate to="/" />;
}

export default ProtectedRoute;