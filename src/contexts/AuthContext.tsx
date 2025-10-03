import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '../services/api/auth';
import { User } from '../types';
import { getStoredToken, removeStoredToken, isTokenExpired } from '../lib/auth-client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Initialize authentication from stored token
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing authentication...');
        
        const token = getStoredToken();
        
        if (!token) {
          console.log('AuthContext: No token found');
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log('AuthContext: Token expired, clearing');
          removeStoredToken();
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // Token exists and is valid, fetch current user
        console.log('AuthContext: Found valid token, fetching user');
        try {
          const currentUser = await AuthService.getCurrentUser();
          if (mounted) {
            setUser(currentUser);
            console.log('AuthContext: User loaded:', currentUser?.username);
          }
        } catch (userError) {
          console.error('AuthContext: Error getting current user:', userError);
          // Token might be invalid, clear it
          removeStoredToken();
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const user = await AuthService.signIn(email, password);
      setUser(user);
      console.log('AuthContext: User signed in:', user.username);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const user = await AuthService.signUp(userData.email, userData.password, {
        username: userData.username,
        fullName: userData.fullName,
      });
      setUser(user);
      console.log('AuthContext: User registered:', user.username);
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AuthService.signOut();
      setUser(null);
      console.log('AuthContext: User signed out');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Clear user even if logout fails
      setUser(null);
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Use the UsersService to update the profile
      const { UsersService } = await import('../services/api/users');
      await UsersService.updateProfile(user.id, userData);
      
      // Fetch updated user data
      const updatedUser = await AuthService.getCurrentUser();
      setUser(updatedUser);
      console.log('AuthContext: Profile updated');
    } catch (error) {
      console.error('AuthContext: Error updating profile:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
