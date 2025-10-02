/**
 * Browser-Safe Authentication Utilities
 * Token storage and client-side token validation
 */

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  exp?: number;
  iat?: number;
}

/**
 * Store token in localStorage (browser only)
 */
export function storeToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

/**
 * Get token from localStorage (browser only)
 */
export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

/**
 * Remove token from localStorage (browser only)
 */
export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Check if a token is expired (browser-safe)
 * This doesn't verify the signature, just checks expiration
 */
export function isTokenExpired(token: string): boolean {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Check expiration
    if (payload.exp) {
      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Get payload from token without verification (browser-safe)
 * WARNING: This does not verify the token signature
 */
export function getTokenPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload as JWTPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
