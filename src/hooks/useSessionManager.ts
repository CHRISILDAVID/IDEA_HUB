import { useEffect } from 'react';
import { authCookieManager } from '../utils/authCookieManager';

/**
 * Hook to set up automatic session management
 * This ensures that auth state is properly maintained across page reloads
 */
export const useSessionManager = () => {
  useEffect(() => {
    console.log('SessionManager: Setting up session management...');
    
    // Set up automatic session refresh
    const { data: { subscription } } = authCookieManager.setupAutoRefresh();
    
    // Handle visibility change to refresh session when user returns to tab
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('SessionManager: Tab became visible, checking session...');
        const isValid = await authCookieManager.hasValidSession();
        
        if (!isValid) {
          console.log('SessionManager: Session invalid, refreshing...');
          await authCookieManager.refreshSession();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      console.log('SessionManager: Cleaning up session management...');
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
