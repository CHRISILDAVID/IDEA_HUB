import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseApi } from '../services/api/index';
import { User } from '../types';
import { authCookieManager } from '../utils/authCookieManager';

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
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any;

    // Enhanced session initialization with cookie support
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing authentication...');
        
        // First, try to get the current session from cookies
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('AuthContext: Error getting session:', sessionError);
        }

        if (mounted && session?.user) {
          console.log('AuthContext: Found existing session for user:', session.user.id);
          try {
            const currentUser = await supabaseApi.getCurrentUser();
            if (mounted) {
              setUser(currentUser);
              console.log('AuthContext: User loaded from session:', currentUser?.username);
            }
          } catch (userError) {
            console.error('AuthContext: Error getting current user:', userError);
            if (mounted) {
              setUser(null);
            }
          }
        } else {
          console.log('AuthContext: No existing session found');
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
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state change listener
    const setupAuthListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('AuthContext: Auth state changed:', event, session?.user?.id);
          
          if (!mounted) return;

          try {
            if (event === 'SIGNED_IN' && session?.user) {
              console.log('AuthContext: User signed in, loading profile...');
              const currentUser = await supabaseApi.getCurrentUser();
              if (mounted) {
                setUser(currentUser);
                setIsLoading(false);
              }
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
              console.log('AuthContext: Token refreshed, updating user...');
              const currentUser = await supabaseApi.getCurrentUser();
              if (mounted) {
                setUser(currentUser);
              }
            } else if (event === 'SIGNED_OUT') {
              console.log('AuthContext: User signed out');
              if (mounted) {
                setUser(null);
                setIsLoading(false);
              }
            }
          } catch (error) {
            console.error('AuthContext: Error handling auth state change:', error);
            if (mounted) {
              setUser(null);
              setIsLoading(false);
            }
          }
        }
      );
      
      authSubscription = subscription;
    };

    // Initialize authentication
    initializeAuth().then(() => {
      if (mounted) {
        setupAuthListener();
      }
    });

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await supabaseApi.signIn(email, password);
      // User will be set via onAuthStateChange
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      await supabaseApi.signUp(userData.email, userData.password, {
        username: userData.username,
        fullName: userData.fullName,
      });
      // User will be set via onAuthStateChange after email confirmation
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  const logout = (): void => {
    // Use the cookie manager for comprehensive logout
    authCookieManager.clearAuth();
    // User will be cleared via onAuthStateChange
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Map from frontend User type to database fields
      const dbUserData: any = {
        ...(userData.username && { username: userData.username }),
        ...(userData.fullName && { full_name: userData.fullName }),
        ...(userData.avatar && { avatar_url: userData.avatar }),
        ...(userData.bio && { bio: userData.bio }),
        ...(userData.location && { location: userData.location }),
        ...(userData.website && { website: userData.website }),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .update(dbUserData)
        .eq('id', user.id as any);

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      // Fetch updated user data
      const updatedUser = await supabaseApi.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
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
