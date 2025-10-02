/**
 * Netlify Function: Get User's Workspaces
 * GET /.netlify/functions/workspaces-list?userId={userId}
 * 
 * If userId is provided and not current user, only returns public workspaces
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
    // Optional authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);
    const payload = token ? verifyToken(token) : null;

    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      // If no userId provided, must be authenticated
      if (!payload) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'User ID required or must be authenticated' }),
        };
      }

      // Return current user's workspaces
      const workspaces = await prisma.workspace.findMany({
        where: {
          userId: payload.userId,
        },
        include: {
          idea: {
            include: {
              author: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Transform data
      const transformedWorkspaces = workspaces.map((workspace) => {
        const { passwordHash: _, ...author } = workspace.idea.author;
        return {
          ...workspace,
          idea: {
            ...workspace.idea,
            author,
          },
        };
      });

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: transformedWorkspaces,
          success: true,
        }),
      };
    }

    // Fetching another user's workspaces
    const isOwnWorkspaces = payload?.userId === userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        userId,
        // Only show public workspaces if viewing someone else's
        ...(isOwnWorkspaces ? {} : { isPublic: true }),
      },
      include: {
        idea: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform data
    const transformedWorkspaces = workspaces.map((workspace) => {
      const { passwordHash: _, ...author } = workspace.idea.author;
      return {
        ...workspace,
        idea: {
          ...workspace.idea,
          author,
        },
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: transformedWorkspaces,
        success: true,
      }),
    };
  } catch (error) {
    console.error('List workspaces error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
