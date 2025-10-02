/**
 * Netlify Function: Update Idea
 * PUT /.netlify/functions/ideas-update
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

    const {
      ideaId,
      title,
      description,
      content,
      canvasData,
      tags,
      category,
      license,
      visibility,
      language,
      status,
    } = JSON.parse(event.body || '{}');

    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Verify idea exists and user is the owner
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    if (idea.authorId !== payload.userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the idea owner can update it' }),
      };
    }

    // Update idea
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(content && { content }),
        ...(canvasData && { canvasData }),
        ...(tags && { tags }),
        ...(category && { category }),
        ...(license && { license }),
        ...(visibility && { visibility }),
        ...(language && { language }),
        ...(status && { status }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            isVerified: true,
          },
        },
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: updatedIdea,
        message: 'Idea updated successfully',
        success: true,
      }),
    };
  } catch (error) {
    console.error('Update idea error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
