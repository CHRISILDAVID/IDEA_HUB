import React, { useEffect, useState } from 'react';
import { getStoredToken, isTokenExpired } from '../lib/auth-client';

interface AuthPersistenceProps {
  children: React.ReactNode;
}

/**
 * Component that ensures authentication state is properly restored from localStorage
 * Should wrap the entire app to handle auth persistence
 */
export const AuthPersistence: React.FC<AuthPersistenceProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthPersistence: Checking stored authentication...');
        
        const token = getStoredToken();
        
        if (token) {
          if (isTokenExpired(token)) {
            console.log('AuthPersistence: Token expired');
          } else {
            console.log('AuthPersistence: Valid token found');
          }
        } else {
          console.log('AuthPersistence: No stored token');
        }
      } catch (error) {
        console.error('AuthPersistence: Error checking auth:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Show loading while initializing auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
