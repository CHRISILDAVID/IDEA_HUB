/**
 * Netlify Function: Delete Idea
 * DELETE /.netlify/functions/ideas-delete?id={ideaId}
 * 
 * Only the author can delete the idea
 * Cascade deletes workspace, collaborators, comments, etc.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow DELETE
  if (event.httpMethod !== 'DELETE') {
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

    const ideaId = event.queryStringParameters?.id;

    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Fetch the idea to check ownership
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    // Only the author can delete
    if (idea.authorId !== payload.userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the author can delete this idea' }),
      };
    }

    // Delete the idea (cascade will handle workspace, collaborators, etc.)
    await prisma.idea.delete({
      where: { id: ideaId },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Idea deleted successfully',
      }),
    };
  } catch (error) {
    console.error('Delete idea error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
