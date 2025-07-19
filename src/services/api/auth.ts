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

      // The profile will be created automatically when getCurrentUser is called
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

      // Try to get user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id as any)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Error getting user profile:', error);
        throw error;
      }
      
      if (!profile) {
        // Profile doesn't exist, create a basic one from auth user
        console.log('Creating missing user profile for:', user.id);
        const newProfile = {
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
          email: user.email,
          full_name: user.user_metadata?.full_name || 'User',
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert(newProfile as any)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          // Return a basic user object even if profile creation fails
          return {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split('@')[0] || 'user',
            email: user.email || '',
            fullName: user.user_metadata?.full_name || 'User',
            joinedAt: user.created_at || new Date().toISOString(),
            followers: 0,
            following: 0,
            publicRepos: 0,
            isVerified: false,
          };
        }

        return transformDbUser(createdProfile as unknown as DbUser);
      }
      
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
