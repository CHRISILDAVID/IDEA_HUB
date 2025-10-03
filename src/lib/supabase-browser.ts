import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Migration note: Supabase is being replaced with Prisma
// This client is stubbed to prevent errors during migration
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase environment variables not configured. Using migration stub.');
}

// Create a browser client for client-side operations with enhanced cookie management
export const createClient = () => {
  // If Supabase is not configured, return a stub client
  if (!isSupabaseConfigured) {
    return createStubClient();
  }
  
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          return parts.pop()?.split(';').shift();
        }
        return null;
      },
      set(name: string, value: string, options: any = {}) {
        let cookieString = `${name}=${value}`;
        
        // Set secure defaults for authentication cookies
        const defaultOptions = {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          sameSite: 'lax',
          secure: window.location.protocol === 'https:',
          ...options
        };
        
        if (defaultOptions.maxAge) {
          cookieString += `; max-age=${defaultOptions.maxAge}`;
        }
        
        if (defaultOptions.domain) {
          cookieString += `; domain=${defaultOptions.domain}`;
        }
        
        if (defaultOptions.path) {
          cookieString += `; path=${defaultOptions.path}`;
        }
        
        if (defaultOptions.secure) {
          cookieString += '; secure';
        }
        
        if (defaultOptions.httpOnly) {
          cookieString += '; httponly';
        }
        
        if (defaultOptions.sameSite) {
          cookieString += `; samesite=${defaultOptions.sameSite}`;
        }
        
        document.cookie = cookieString;
      },
      remove(name: string, options: any = {}) {
        this.set(name, '', {
          ...options,
          maxAge: 0,
        });
      },
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      debug: process.env.NODE_ENV === 'development',
    },
  });
};

// Create a singleton instance
export const supabase = createClient();

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  throw error;
};

/**
 * Create a stub Supabase client for migration
 * This prevents errors when Supabase env vars are not set
 */
function createStubClient() {
  const stubAuth = {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => ({ error: null }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
    signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase not configured') }),
  };

  return {
    auth: stubAuth,
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error('Supabase not configured') }),
        }),
      }),
      update: () => ({
        eq: async () => ({ data: null, error: new Error('Supabase not configured') }),
      }),
      insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({
        eq: async () => ({ data: null, error: new Error('Supabase not configured') }),
      }),
    }),
    rpc: async () => ({ data: null, error: new Error('Supabase not configured') }),
  } as any;
}
