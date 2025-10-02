/**
 * Netlify Function: List Collaborators
 * GET /.netlify/functions/collaborators-list?ideaId={ideaId}
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const ideaId = event.queryStringParameters?.ideaId;
    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Fetch collaborators
    const collaborators = await prisma.ideaCollaborator.findMany({
      where: { ideaId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            email: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: collaborators,
        count: collaborators.length,
        maxAllowed: 3,
        success: true,
      }),
    };
  } catch (error) {
    console.error('List collaborators error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
