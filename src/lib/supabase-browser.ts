import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a browser client for client-side operations with enhanced cookie management
export const createClient = () => {
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
