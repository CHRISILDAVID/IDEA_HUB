/**
 * Netlify Function: User Sign Out
 * POST /.netlify/functions/auth-signout
 * 
 * Note: Since we're using JWT tokens, signout is primarily handled client-side
 * by removing the token. This endpoint exists for consistency and potential
 * future token blacklisting if needed.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // For JWT-based auth, signout is handled client-side
    // by removing the token from localStorage.
    // This endpoint confirms the signout action.
    
    // In the future, we could implement token blacklisting here
    // by storing expired tokens in a database or cache.
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Signed out successfully',
      }),
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
