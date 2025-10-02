/**
 * Netlify Function: Follow/Unfollow User
 * POST /.netlify/functions/users-follow
 * 
 * Body: { userId: string, action: 'follow' | 'unfollow' }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const { userId, action } = JSON.parse(event.body || '{}');

    if (!userId || !action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID and action are required' }),
      };
    }

    if (action !== 'follow' && action !== 'unfollow') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Action must be "follow" or "unfollow"' }),
      };
    }

    // Can't follow yourself
    if (userId === payload.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Cannot follow yourself' }),
      };
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    if (action === 'follow') {
      // Create follow relationship
      await prisma.follow.create({
        data: {
          followerId: payload.userId,
          followingId: userId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'FOLLOW',
          message: `Someone started following you`,
          relatedUserId: payload.userId,
          relatedUrl: `/users/${payload.userId}`,
        },
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'User followed successfully',
          isFollowing: true,
        }),
      };
    } else {
      // Remove follow relationship
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: payload.userId,
            followingId: userId,
          },
        },
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'User unfollowed successfully',
          isFollowing: false,
        }),
      };
    }
  } catch (error) {
    console.error('Follow/unfollow user error:', error);

    // Check for unique constraint or not found errors
    if (error instanceof Error && 'code' in error) {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Already following this user' }),
        };
      }
      if (prismaError.code === 'P2025') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Not following this user' }),
        };
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
