/**
 * Netlify Function: Star/Unstar Idea
 * POST /.netlify/functions/ideas-star
 * 
 * Body: { ideaId: string, action: 'star' | 'unstar' }
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

    const { ideaId, action } = JSON.parse(event.body || '{}');

    if (!ideaId || !action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID and action are required' }),
      };
    }

    if (action !== 'star' && action !== 'unstar') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Action must be "star" or "unstar"' }),
      };
    }

    // Check if idea exists
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    if (action === 'star') {
      // Add star
      await prisma.$transaction(async (tx) => {
        // Create star record
        await tx.star.create({
          data: {
            userId: payload.userId,
            ideaId,
          },
        });

        // Increment star count
        await tx.idea.update({
          where: { id: ideaId },
          data: {
            stars: {
              increment: 1,
            },
          },
        });

        // Create notification for idea author (if not starring own idea)
        if (idea.authorId !== payload.userId) {
          await tx.notification.create({
            data: {
              userId: idea.authorId,
              type: 'STAR',
              message: `Someone starred your idea "${idea.title}"`,
              relatedUserId: payload.userId,
              relatedIdeaId: ideaId,
              relatedUrl: `/ideas/${ideaId}`,
            },
          });
        }
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'Idea starred successfully',
          isStarred: true,
        }),
      };
    } else {
      // Remove star
      await prisma.$transaction(async (tx) => {
        // Delete star record
        await tx.star.delete({
          where: {
            userId_ideaId: {
              userId: payload.userId,
              ideaId,
            },
          },
        });

        // Decrement star count
        await tx.idea.update({
          where: { id: ideaId },
          data: {
            stars: {
              decrement: 1,
            },
          },
        });
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'Idea unstarred successfully',
          isStarred: false,
        }),
      };
    }
  } catch (error) {
    console.error('Star/unstar idea error:', error);
    
    // Check if it's a unique constraint error (already starred/not starred)
    if (error instanceof Error && 'code' in error) {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Idea is already starred' }),
        };
      }
      if (prismaError.code === 'P2025') {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Idea is not starred' }),
        };
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
