/**
 * Netlify Function: Add Collaborator to Idea
 * POST /.netlify/functions/collaborators-add
 * 
 * CRITICAL CONSTRAINT: Maximum 3 collaborators per idea
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

    const { ideaId, userId, role = 'VIEWER' } = JSON.parse(event.body || '{}');

    if (!ideaId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID and user ID are required' }),
      };
    }

    // Verify the idea exists and current user is the owner
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

    // Only the owner can add collaborators
    if (idea.authorId !== payload.userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the idea owner can add collaborators' }),
      };
    }

    // CRITICAL CONSTRAINT: Check if already at max 3 collaborators
    if (idea.collaborators.length >= 3) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Maximum collaborator limit reached',
          message: 'Each idea can have a maximum of 3 collaborators',
          currentCount: idea.collaborators.length,
        }),
      };
    }

    // Check if user exists
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAdd) {
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

    // Add collaborator
    const collaborator = await prisma.ideaCollaborator.create({
      data: {
        ideaId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: collaborator,
        message: 'Collaborator added successfully',
        success: true,
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
