import { removeStoredToken } from '../lib/auth-client';

/**
 * Utility functions for managing authentication
 * Note: This was migrated from Supabase to Prisma-based auth
 */

export const authCookieManager = {
  /**
   * Initialize auth from stored token
   */
  async initializeFromCookies() {
    console.log('AuthCookieManager: Method deprecated - using localStorage instead');
    return null;
  },

  /**
   * Refresh the session (no longer used with JWT auth)
   */
  async refreshSession() {
    console.log('AuthCookieManager: Method deprecated - JWT tokens auto-refresh');
    return null;
  },

  /**
   * Clear authentication
   */
  async clearAuth() {
    try {
      console.log('AuthCookieManager: Clearing authentication...');
      removeStoredToken();
      console.log('AuthCookieManager: Authentication cleared');
    } catch (error) {
      console.error('AuthCookieManager: Failed to clear auth:', error);
    }
  },

  /**
   * Check if user has a valid session
   */
  async hasValidSession() {
    console.log('AuthCookieManager: Method deprecated - check token in localStorage');
    return false;
  },

  /**
   * Get current user from session
   */
  async getCurrentUser() {
    console.log('AuthCookieManager: Method deprecated - use AuthService.getCurrentUser()');
    return null;
  },

  /**
   * Handle page reload by checking and restoring session
   */
  async handlePageReload() {
    console.log('AuthCookieManager: Method deprecated - auth handled by AuthContext');
    return null;
  },

  /**
   * Set up automatic session refresh
   */
  setupAutoRefresh() {
    console.log('AuthCookieManager: Method deprecated - JWT tokens managed by backend');
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
};
