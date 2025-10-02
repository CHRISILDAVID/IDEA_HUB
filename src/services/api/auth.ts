import apiClient from '../../lib/api-client';
import { 
  verifyToken, 
  getStoredToken, 
  storeToken, 
  removeStoredToken,
  type JWTPayload 
} from '../../lib/auth';
import { User } from '../../types';
import { transformPrismaUser } from './transformers';

// Store current user in memory for quick access
let currentUserCache: { user: User; token: string } | null = null;

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, userData: { username: string; fullName: string }) {
    try {
      const response = await apiClient.post('auth-signup', {
        email,
        password,
        username: userData.username,
        fullName: userData.fullName,
      });

      if (!response.success || !response.user || !response.token) {
        throw new Error(response.error || 'Signup failed');
      }

      // Store token
      storeToken(response.token);

      // Transform and cache user
      const transformedUser = transformPrismaUser(response.user);
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
      const response = await apiClient.post('auth-signin', {
        email,
        password,
      });

      if (!response.success || !response.user || !response.token) {
        throw new Error(response.error || 'Sign in failed');
      }

      // Store token
      storeToken(response.token);

      // Transform and cache user
      const transformedUser = transformPrismaUser(response.user);
      currentUserCache = { user: transformedUser, token: response.token };

      return {
        user: transformedUser,
        token: response.token,
        session: { access_token: response.token }
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
      removeStoredToken();
      currentUserCache = null;
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
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

      // Verify token locally first
      const payload = verifyToken(token);
      if (!payload) {
        removeStoredToken();
        return null;
      }

      // Fetch user from API
      const response = await apiClient.get('auth-user');
      
      if (!response.success || !response.user) {
        removeStoredToken();
        return null;
      }

      // Transform and cache user
      const transformedUser = transformPrismaUser(response.user);
      currentUserCache = { user: transformedUser, token };

      return transformedUser;
    } catch (error) {
      console.error('Error getting current user:', error);
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

      const payload = verifyToken(token);
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

      const payload = verifyToken(token);
      return !!payload;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}
