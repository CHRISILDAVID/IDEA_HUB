import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { redirectTo = '/login', requireAuth = true } = options;
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuthentication = () => {
    if (!isLoading && !isAuthenticated && requireAuth) {
      const currentPath = location.pathname + location.search;
      navigate(`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
      return false;
    }
    return isAuthenticated || !requireAuth;
  };

  const checkAuthForAction = (action: () => void, errorMessage = 'You must be logged in to perform this action') => {
    if (!isAuthenticated) {
      // You could show a toast notification here
      console.warn(errorMessage);
      requireAuthentication();
      return false;
    }
    action();
    return true;
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    requireAuthentication,
    checkAuthForAction,
    canAccess: isAuthenticated || !requireAuth,
  };
};
