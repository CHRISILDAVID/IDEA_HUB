/**
 * Netlify Function: Remove Collaborator
 * DELETE /.netlify/functions/collaborators-remove
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

    const ideaId = event.queryStringParameters?.ideaId;
    const userId = event.queryStringParameters?.userId;

    if (!ideaId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID and user ID are required' }),
      };
    }

    // Verify the idea exists and current user is the owner
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    // Only the owner can remove collaborators
    if (idea.authorId !== payload.userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the idea owner can remove collaborators' }),
      };
    }

    // Remove collaborator
    await prisma.ideaCollaborator.delete({
      where: {
        ideaId_userId: {
          ideaId,
          userId,
        },
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Collaborator removed successfully',
        success: true,
      }),
    };
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
