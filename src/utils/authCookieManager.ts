import { supabase } from '../lib/supabase';

/**
 * Utility functions for managing Supabase authentication cookies
 */

export const authCookieManager = {
  /**
   * Initialize auth from cookies on app startup
   */
  async initializeFromCookies() {
    try {
      console.log('AuthCookieManager: Initializing from cookies...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthCookieManager: Error initializing from cookies:', error);
        return null;
      }

      if (session) {
        console.log('AuthCookieManager: Session found in cookies for user:', session.user?.id);
      }

      return session;
    } catch (error) {
      console.error('AuthCookieManager: Failed to initialize auth from cookies:', error);
      return null;
    }
  },

  /**
   * Refresh the session and update cookies
   */
  async refreshSession() {
    try {
      console.log('AuthCookieManager: Refreshing session...');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthCookieManager: Error refreshing session:', error);
        return null;
      }

      if (session) {
        console.log('AuthCookieManager: Session refreshed for user:', session.user?.id);
      }

      return session;
    } catch (error) {
      console.error('AuthCookieManager: Failed to refresh session:', error);
      return null;
    }
  },

  /**
   * Clear authentication cookies and session
   */
  async clearAuth() {
    try {
      console.log('AuthCookieManager: Clearing authentication...');
      await supabase.auth.signOut();
      
      // Clear any additional cookies if needed
      const cookiesToClear = [
        'sb-access-token',
        'sb-refresh-token',
        'supabase-auth-token',
        'supabase.auth.token'
      ];

      cookiesToClear.forEach(cookieName => {
        // Clear for current domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        // Clear for root domain
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        // Clear for subdomain
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        if (domain !== window.location.hostname) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
        }
      });

      console.log('AuthCookieManager: Authentication cleared');
    } catch (error) {
      console.error('AuthCookieManager: Failed to clear auth:', error);
    }
  },

  /**
   * Check if user has a valid session
   */
  async hasValidSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isValid = !!session?.access_token && new Date(session.expires_at! * 1000) > new Date();
      console.log('AuthCookieManager: Session validity check:', isValid);
      return isValid;
    } catch (error) {
      console.error('AuthCookieManager: Error checking session validity:', error);
      return false;
    }
  },

  /**
   * Get current user from session
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('AuthCookieManager: Error getting current user:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('AuthCookieManager: Failed to get current user:', error);
      return null;
    }
  },

  /**
   * Handle page reload by checking and restoring session
   */
  async handlePageReload() {
    try {
      console.log('AuthCookieManager: Handling page reload...');
      
      // First check if we have a session in cookies
      const session = await this.initializeFromCookies();
      
      if (!session) {
        console.log('AuthCookieManager: No session found on page reload');
        return null;
      }

      // Verify the session is still valid
      const isValid = await this.hasValidSession();
      
      if (!isValid) {
        console.log('AuthCookieManager: Session invalid, clearing...');
        // Session exists but is invalid, clear it
        await this.clearAuth();
        return null;
      }

      // Get the user associated with the session
      const user = await this.getCurrentUser();
      
      if (!user) {
        console.log('AuthCookieManager: Session valid but no user, clearing...');
        // Session exists but user is invalid, clear it
        await this.clearAuth();
        return null;
      }

      console.log('AuthCookieManager: Page reload handled successfully for user:', user.id);
      return { session, user };
    } catch (error) {
      console.error('AuthCookieManager: Error handling page reload:', error);
      return null;
    }
  },

  /**
   * Set up automatic session refresh
   */
  setupAutoRefresh() {
    console.log('AuthCookieManager: Setting up automatic session refresh...');
    
    // Listen for auth state changes to ensure cookies are always updated
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthCookieManager: Auth state changed:', event);
      
      if (event === 'TOKEN_REFRESHED' && session) {
        console.log('AuthCookieManager: Token refreshed automatically');
      } else if (event === 'SIGNED_OUT') {
        console.log('AuthCookieManager: User signed out, cookies should be cleared');
      }
    });
  }
};
