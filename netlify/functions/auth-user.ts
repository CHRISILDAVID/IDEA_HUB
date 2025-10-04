/**
 * Netlify Function: Get Current User
 * GET /.netlify/functions/auth-user
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  requireAuth,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import { sanitizeUser } from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['GET']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth;

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
    });

    if (!user) {
      return ErrorResponses.notFound('User');
    }

    // Return user without password
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: sanitizeUser(user),
        success: true,
      }),
    };
  } catch (error) {
    console.error('Get user error:', error);
    return ErrorResponses.serverError();
  }
};
