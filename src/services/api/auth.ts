import { supabase, handleSupabaseError } from '../../lib/supabase';
import { User } from '../../types';
import { transformDbUser, DbUser } from './transformers';

export class AuthService {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, userData: { username: string; fullName: string }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
          },
        },
      });

      if (authError) throw authError;

      // Only create profile if user is confirmed (email confirmation disabled)
      // or if we have a confirmed user
      if (authData.user && authData.user.email_confirmed_at) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: userData.username,
            email: email,
            full_name: userData.fullName,
          } as any);

        if (profileError) throw profileError;
      }

      return authData;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Sign in an existing user
   */
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Get the currently authenticated user
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id as any)
        .single();

      if (error) throw error;
      if (!profile) return null;
      
      return transformDbUser(profile as unknown as DbUser);
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
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
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
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
}
