/**
 * Netlify Function: Get Single Idea
 * GET /.netlify/functions/ideas-get?id={ideaId}
 * 
 * Access control:
 * - Public ideas: anyone can view
 * - Private ideas: only author and collaborators can view
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

    // Optional authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);
    const payload = token ? verifyToken(token) : null;

    // Fetch the idea with relations
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: true,
        collaborators: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            starredBy: true,
            comments: true,
            forkIdeas: true,
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

    // Check access permissions for private ideas
    if (idea.visibility === 'PRIVATE') {
      if (!payload) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Authentication required to view this idea' }),
        };
      }

      // Check if user is author or collaborator
      const isAuthor = idea.authorId === payload.userId;
      const isCollaborator = idea.collaborators.some(c => c.userId === payload.userId);

      if (!isAuthor && !isCollaborator) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'You do not have permission to view this idea' }),
        };
      }
    }

    // Check if current user has starred this idea
    let isStarred = false;
    if (payload) {
      const star = await prisma.star.findUnique({
        where: {
          userId_ideaId: {
            userId: payload.userId,
            ideaId: idea.id,
          },
        },
      });
      isStarred = !!star;
    }

    // Transform data
    const { passwordHash: _, ...author } = idea.author;
    const transformedCollaborators = idea.collaborators.map((collab) => {
      const { passwordHash: __, ...user } = collab.user;
      return {
        ...collab,
        user,
      };
    });

    const { _count, collaborators, ...ideaData } = idea;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...ideaData,
          author,
          collaborators: transformedCollaborators,
          stars: _count.starredBy,
          comments: _count.comments,
          forks: _count.forkIdeas,
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
