import { 
  getStoredToken, 
  storeToken, 
  removeStoredToken,
  isTokenExpired,
  getTokenPayload
} from '../../lib/auth-client';
import { User } from '../../types';
import apiClient from '../../lib/api-client';

// Store current user in memory for quick access
let currentUserCache: { user: User; token: string } | null = null;

// Transform API user response to User type
function transformApiUser(apiUser: any): User {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    fullName: apiUser.fullName || apiUser.full_name,
    avatar: apiUser.avatarUrl || apiUser.avatar_url,
    bio: apiUser.bio,
    location: apiUser.location,
    website: apiUser.website,
    joinedAt: apiUser.joinedAt || apiUser.joined_at,
    followers: apiUser.followers || 0,
    following: apiUser.following || 0,
    publicRepos: apiUser.publicRepos || apiUser.public_repos || 0,
    isVerified: apiUser.isVerified || apiUser.is_verified || false,
  };
}

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, userData: { username: string; fullName: string }) {
    try {
      const response = await apiClient.post<{
        user: any;
        token: string;
        success: boolean;
      }>('/auth-signup', {
        email,
        password,
        username: userData.username,
        fullName: userData.fullName,
      });

      if (!response.success || !response.user || !response.token) {
        throw new Error('Signup failed');
      }

      // Store token
      storeToken(response.token);

      // Transform and cache user
      const transformedUser = transformApiUser(response.user);
      currentUserCache = { user: transformedUser, token: response.token };

      return {
        user: transformedUser,
        token: response.token,
        session: { access_token: response.token }
      };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(email: string, password: string) {
    try {
      const response = await apiClient.post<{
        user: any;
        token: string;
        session: { access_token: string };
        success: boolean;
      }>('/auth-signin', {
        email,
        password,
      });

      if (!response.success || !response.user || !response.token) {
        throw new Error('Sign in failed');
      }

      // Store token
      storeToken(response.token);

      // Transform and cache user
      const transformedUser = transformApiUser(response.user);
      currentUserCache = { user: transformedUser, token: response.token };

      return {
        user: transformedUser,
        token: response.token,
        session: response.session
      };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut() {
    try {
      // Call the signout endpoint (for consistency, though JWT signout is primarily client-side)
      await apiClient.post('/auth-signout');
      
      // Remove token and clear cache
      removeStoredToken();
      currentUserCache = null;
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if the API call fails, still sign out locally
      removeStoredToken();
      currentUserCache = null;
      return { success: true };
    }
  }

  /**
   * Get the currently authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      // Check cache first
      if (currentUserCache?.user) {
        return currentUserCache.user;
      }

      // Get token from storage
      const token = getStoredToken();
      if (!token) return null;

      // Check if token is expired (browser-safe check)
      if (isTokenExpired(token)) {
        removeStoredToken();
        return null;
      }

      // Fetch user from API
      const response = await apiClient.get<{
        user: any;
        success: boolean;
      }>('/auth-user');

      if (!response.success || !response.user) {
        removeStoredToken();
        return null;
      }

      // Transform and cache user
      const transformedUser = transformApiUser(response.user);
      currentUserCache = { user: transformedUser, token };

      return transformedUser;
    } catch (error) {
      console.error('Error getting current user:', error);
      // If API call fails, remove token and return null
      removeStoredToken();
      return null;
    }
  }

  /**
   * Get the current user ID from the auth session
   */
  static async getCurrentUserId(): Promise<string | null> {
    try {
      const token = getStoredToken();
      if (!token) return null;

      // Check if token is expired
      if (isTokenExpired(token)) {
        removeStoredToken();
        return null;
      }

      const payload = getTokenPayload(token);
      return payload?.userId || null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const token = getStoredToken();
      if (!token) return false;

      // Check if token is not expired
      return !isTokenExpired(token);
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}
