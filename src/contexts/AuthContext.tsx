import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseApi } from '../services/api/index';
import { User } from '../types';

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
    // Check for existing session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const currentUser = await supabaseApi.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('AuthContext: Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const currentUser = await supabaseApi.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('AuthContext: Error getting current user:', error);
            setUser(null);
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          try {
            const currentUser = await supabaseApi.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            console.error('AuthContext: Error getting current user after refresh:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
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
    supabaseApi.signOut();
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