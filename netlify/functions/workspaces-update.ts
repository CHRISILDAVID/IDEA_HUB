/**
 * Netlify Function: Update Workspace
 * PUT /.netlify/functions/workspaces-update
 * 
 * CONSTRAINT: Only owner and editors can update
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow PUT/PATCH
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
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

    const { workspaceId, content, thumbnail, name } = JSON.parse(event.body || '{}');

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

    // Check permissions: owner or editor collaborator
    const isOwner = workspace.userId === payload.userId;
    const isEditor = workspace.idea.collaborators.some(
      c => c.userId === payload.userId && (c.role === 'OWNER' || c.role === 'EDITOR')
    );

    if (!isOwner && !isEditor) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'You do not have permission to edit this workspace' }),
      };
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(content && { content }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(name && { name }),
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: updatedWorkspace,
        message: 'Workspace updated successfully',
        success: true,
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
