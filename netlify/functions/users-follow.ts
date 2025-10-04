/**
 * Netlify Function: Follow/Unfollow User
 * POST /.netlify/functions/users-follow
 * 
 * Body: { userId: string, action: 'follow' | 'unfollow' }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  requireAuth,
  validateBodyFields,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['POST']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth;

    const body = JSON.parse(event.body || '{}');
    const { userId, action } = body;

    // Validate required fields
    const validationError = validateBodyFields(body, ['userId', 'action']);
    if (validationError) return validationError;

    if (action !== 'follow' && action !== 'unfollow') {
      return ErrorResponses.badRequest('Action must be "follow" or "unfollow"');
    }

    // Can't follow yourself
    if (userId === auth.userId) {
      return ErrorResponses.badRequest('Cannot follow yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return ErrorResponses.notFound('User');
    }

    if (action === 'follow') {
      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: auth.userId,
          followingId: userId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'FOLLOW',
          message: `Someone started following you`,
          relatedUserId: auth.userId,
          relatedUrl: `/users/${auth.userId}`,
        },
      });

      return successResponse(
        { isFollowing: true },
        'User followed successfully'
      );
    } else {
      // Remove follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: auth.userId,
            followingId: userId,
          },
        },
      });

      return successResponse(
        { isFollowing: false },
        'User unfollowed successfully'
      );
    }
  } catch (error) {
    console.error('Follow/unfollow user error:', error);

    // Check for unique constraint or not found errors
    if (error instanceof Error && 'code' in error) {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return ErrorResponses.badRequest('Already following this user');
      }
      if (prismaError.code === 'P2025') {
        return ErrorResponses.badRequest('Not following this user');
      }
    }

    return ErrorResponses.serverError();
  }
};
