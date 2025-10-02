/**
 * Netlify Function: Get Single Idea
 * GET /.netlify/functions/ideas-get?id={ideaId}
 * 
 * CONSTRAINT: Enforces public/private access control
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const ideaId = event.queryStringParameters?.id;
    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Get current user (if authenticated)
    let currentUserId: string | null = null;
    const token = extractTokenFromHeader(event.headers.authorization || null);
    if (token) {
      const payload = verifyToken(token);
      currentUserId = payload?.userId || null;
    }

    // Fetch idea
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            isVerified: true,
          },
        },
        workspace: true,
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            starredBy: true,
          },
        },
      },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    // Access control: Check if user can view this idea
    if (idea.visibility === 'PRIVATE') {
      if (!currentUserId) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Authentication required to view private idea' }),
        };
      }

      const isOwner = idea.authorId === currentUserId;
      const isCollaborator = idea.collaborators.some(c => c.userId === currentUserId);

      if (!isOwner && !isCollaborator) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Access denied: This idea is private' }),
        };
      }
    }

    // Check if current user has starred this idea
    let isStarred = false;
    if (currentUserId) {
      const star = await prisma.star.findUnique({
        where: {
          userId_ideaId: {
            userId: currentUserId,
            ideaId: idea.id,
          },
        },
      });
      isStarred = !!star;
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...idea,
          isStarred,
        },
        success: true,
      }),
    };
  } catch (error) {
    console.error('Get idea error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
