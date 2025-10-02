/**
 * Netlify Function: Star/Unstar Idea
 * POST /.netlify/functions/ideas-star
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
    // Extract and verify token
    const token = extractTokenFromHeader(event.headers.authorization || null);
    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    const { ideaId, unstar = false } = JSON.parse(event.body || '{}');

    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Verify idea exists
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    if (unstar) {
      // Remove star
      await prisma.$transaction(async (tx) => {
        await tx.star.delete({
          where: {
            userId_ideaId: {
              userId: payload.userId,
              ideaId,
            },
          },
        });

        await tx.idea.update({
          where: { id: ideaId },
          data: {
            stars: { decrement: 1 },
          },
        });
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Idea unstarred successfully',
          isStarred: false,
          success: true,
        }),
      };
    } else {
      // Add star (if not already starred)
      const existingStar = await prisma.star.findUnique({
        where: {
          userId_ideaId: {
            userId: payload.userId,
            ideaId,
          },
        },
      });

      if (existingStar) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Idea already starred' }),
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.star.create({
          data: {
            userId: payload.userId,
            ideaId,
          },
        });

        await tx.idea.update({
          where: { id: ideaId },
          data: {
            stars: { increment: 1 },
          },
        });
      });

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Idea starred successfully',
          isStarred: true,
          success: true,
        }),
      };
    }
  } catch (error) {
    console.error('Star idea error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
