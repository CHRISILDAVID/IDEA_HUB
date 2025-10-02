import prisma from '../../lib/prisma';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
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
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: userData.username }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new Error('Email already in use');
        }
        if (existingUser.username === userData.username) {
          throw new Error('Username already taken');
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username: userData.username,
          fullName: userData.fullName,
          passwordHash,
        },
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      // Store token
      storeToken(token);

      // Transform and cache user
      const transformedUser = transformPrismaUser(user);
      currentUserCache = { user: transformedUser, token };

      return {
        user: transformedUser,
        token,
        session: { access_token: token }
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
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      // Store token
      storeToken(token);

      // Transform and cache user
      const transformedUser = transformPrismaUser(user);
      currentUserCache = { user: transformedUser, token };

      return {
        user: transformedUser,
        token,
        session: { access_token: token }
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

      // Verify token
      const payload = verifyToken(token);
      if (!payload) {
        removeStoredToken();
        return null;
      }

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        removeStoredToken();
        return null;
      }

      // Transform and cache user
      const transformedUser = transformPrismaUser(user);
      currentUserCache = { user: transformedUser, token };

      return transformedUser;
    } catch (error) {
      console.error('Error getting current user:', error);
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
