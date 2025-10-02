/**
 * Netlify Function: Update Workspace
 * PUT /.netlify/functions/workspaces-update
 * 
 * Only owner and collaborators with EDITOR role can update
 * Body: { workspaceId: string, content?: any, name?: string, thumbnail?: string, isPublic?: boolean }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow PUT
  if (event.httpMethod !== 'PUT') {
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

    const { workspaceId, content, name, thumbnail, isPublic } = JSON.parse(event.body || '{}');

    if (!workspaceId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Workspace ID is required' }),
      };
    }

    // Fetch workspace with idea and collaborators
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        idea: {
          include: {
            collaborators: true,
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

    // Check if user has edit permissions
    const isOwner = workspace.userId === payload.userId;
    const collaborator = workspace.idea.collaborators.find(c => c.userId === payload.userId);
    const isEditor = collaborator?.role === 'EDITOR' || collaborator?.role === 'OWNER';

    if (!isOwner && !isEditor) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'You do not have permission to edit this workspace' }),
      };
    }

    // Build update data
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (name !== undefined) updateData.name = name;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    // Only owner can change visibility
    if (isPublic !== undefined && isOwner) updateData.isPublic = isPublic;

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        idea: {
          include: {
            author: true,
          },
        },
      },
    });

    // Transform data
    const { passwordHash: _, ...author } = updatedWorkspace.idea.author;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...updatedWorkspace,
          idea: {
            ...updatedWorkspace.idea,
            author,
          },
        },
        success: true,
        message: 'Workspace updated successfully',
      }),
    };
  } catch (error) {
    console.error('Update workspace error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
