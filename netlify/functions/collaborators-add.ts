/**
 * Netlify Function: Add Collaborator to Idea
 * POST /.netlify/functions/collaborators-add
 * 
 * CRITICAL CONSTRAINT: Maximum 3 collaborators per idea
 * 
 * Body: { ideaId: string, userId: string, role?: 'OWNER' | 'EDITOR' | 'VIEWER' }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
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

    const { ideaId, userId, role } = JSON.parse(event.body || '{}');

    if (!ideaId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID and User ID are required' }),
      };
    }

    // Fetch the idea to check ownership
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        collaborators: true,
      },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    // Only the author can add collaborators
    if (idea.authorId !== payload.userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the idea author can add collaborators' }),
      };
    }

    // Check if user is trying to add themselves
    if (userId === payload.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Cannot add yourself as a collaborator' }),
      };
    }

    // CRITICAL CONSTRAINT: Check if already has 3 collaborators (excluding author)
    const collaboratorCount = idea.collaborators.length;
    if (collaboratorCount >= 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Maximum of 3 collaborators allowed per idea',
          currentCount: collaboratorCount,
          maxAllowed: 3,
        }),
      };
    }

    // Check if user already exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Check if already a collaborator
    const existingCollaborator = await prisma.ideaCollaborator.findUnique({
      where: {
        ideaId_userId: {
          ideaId,
          userId,
        },
      },
    });

    if (existingCollaborator) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User is already a collaborator' }),
      };
    }

    // Add the collaborator
    const collaborator = await prisma.ideaCollaborator.create({
      data: {
        ideaId,
        userId,
        role: role || 'VIEWER',
      },
      include: {
        user: true,
      },
    });

    // Create notification for the new collaborator
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'MENTION',
        message: `You have been added as a collaborator to "${idea.title}"`,
        relatedUserId: payload.userId,
        relatedIdeaId: ideaId,
        relatedUrl: `/ideas/${ideaId}`,
      },
    });

    // Transform user data
    const { passwordHash: _, ...user } = collaborator.user;

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...collaborator,
          user,
        },
        success: true,
        message: 'Collaborator added successfully',
        collaboratorCount: collaboratorCount + 1,
        maxAllowed: 3,
      }),
    };
  } catch (error) {
    console.error('Add collaborator error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
