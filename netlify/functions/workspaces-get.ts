/**
 * Netlify Function: Get Workspace
 * GET /.netlify/functions/workspaces-get?id={workspaceId}
 * 
 * CONSTRAINT: Enforces access control (owner, collaborators only for private)
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

    // Get current user (if authenticated)
    let currentUserId: string | null = null;
    const token = extractTokenFromHeader(event.headers.authorization || null);
    if (token) {
      const payload = verifyToken(token);
      currentUserId = payload?.userId || null;
    }

    // Fetch workspace with associated idea
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        idea: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
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
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
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

    // Access control: Check if user can view this workspace
    if (!workspace.isPublic) {
      if (!currentUserId) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Authentication required to view private workspace' }),
        };
      }

      const isOwner = workspace.userId === currentUserId;
      const isCollaborator = workspace.idea.collaborators.some(c => c.userId === currentUserId);

      if (!isOwner && !isCollaborator) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Access denied: This workspace is private' }),
        };
      }
    }

    // Determine edit permissions
    const canEdit = currentUserId && (
      workspace.userId === currentUserId || 
      workspace.idea.collaborators.some(c => 
        c.userId === currentUserId && (c.role === 'OWNER' || c.role === 'EDITOR')
      )
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...workspace,
          canEdit,
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
