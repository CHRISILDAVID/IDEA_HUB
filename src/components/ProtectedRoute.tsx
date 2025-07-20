import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Give some time for the auth context to initialize from cookies
    const timer = setTimeout(() => {
      setHasCheckedAuth(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking authentication or during initial auth check
  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {!hasCheckedAuth ? 'Checking authentication...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated, preserving the intended destination
  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return (
      <Navigate 
        to={`${redirectTo}?redirect=${encodeURIComponent(location.pathname + location.search)}`} 
        replace 
      />
    );
  }

  console.log('ProtectedRoute: User authenticated, allowing access to protected route');
  return <>{children}</>;
};
