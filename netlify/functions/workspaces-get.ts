/**
 * Netlify Function: Get Single Workspace
 * GET /.netlify/functions/workspaces-get?id={workspaceId}
 * 
 * Access control:
 * - Public workspaces: anyone can view
 * - Private workspaces: only owner and idea collaborators can view
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
    const workspaceId = event.queryStringParameters?.id;

    if (!workspaceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Workspace ID is required' }),
      };
    }

    // Optional authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);
    const payload = token ? verifyToken(token) : null;

    // Fetch workspace with related idea and collaborators
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        idea: {
          include: {
            author: true,
            collaborators: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Workspace not found' }),
      };
    }

    // Check access permissions
    if (!workspace.isPublic) {
      if (!payload) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Authentication required to view this workspace' }),
        };
      }

      // Check if user is owner or collaborator
      const isOwner = workspace.userId === payload.userId;
      const isCollaborator = workspace.idea.collaborators.some(c => c.userId === payload.userId);

      if (!isOwner && !isCollaborator) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'You do not have permission to view this workspace' }),
        };
      }
    }

    // Transform data
    const { passwordHash: _, ...author } = workspace.idea.author;
    const transformedCollaborators = workspace.idea.collaborators.map((collab) => {
      const { passwordHash: __, ...user } = collab.user;
      return {
        ...collab,
        user,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...workspace,
          idea: {
            ...workspace.idea,
            author,
            collaborators: transformedCollaborators,
          },
        },
        success: true,
      }),
    };
  } catch (error) {
    console.error('Get workspace error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
