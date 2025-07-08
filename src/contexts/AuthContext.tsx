import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { supabaseApi } from '../services/supabaseApi';
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
        console.error('Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user && session.user.email_confirmed_at) {
          // Ensure user profile exists
          await ensureUserProfile(session.user);
          const currentUser = await supabaseApi.getCurrentUser();
          setUser(currentUser);
        } else if (event === 'TOKEN_REFRESHED' && session?.user && session.user.email_confirmed_at) {
          const currentUser = await supabaseApi.getCurrentUser();
          setUser(currentUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserProfile = async (user: any) => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        // Create profile from user metadata
        const { error } = await supabase
          .from('users')
          .insert({
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User',
          });

        if (error) {
          console.error('Error creating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };
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
      // TODO: Implement profile update in supabaseApi
      const updatedUser = { ...user, ...userData };
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