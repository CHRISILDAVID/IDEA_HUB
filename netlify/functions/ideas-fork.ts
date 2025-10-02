/**
 * Netlify Function: Fork Idea
 * POST /.netlify/functions/ideas-fork
 * 
 * CRITICAL CONSTRAINT: Fork creates a new workspace under the forked user's account
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

    const { ideaId, newTitle, newDescription } = JSON.parse(event.body || '{}');

    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Fetch original idea
    const originalIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        workspace: true,
      },
    });

    if (!originalIdea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    // Check if idea is public
    if (originalIdea.visibility === 'PRIVATE') {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Cannot fork private ideas' }),
      };
    }

    // ATOMIC TRANSACTION: Create forked idea with new workspace
    const result = await prisma.$transaction(async (tx) => {
      // Create the forked idea
      const forkedIdea = await tx.idea.create({
        data: {
          title: newTitle || `${originalIdea.title} (Fork)`,
          description: newDescription || originalIdea.description,
          content: originalIdea.content,
          canvasData: originalIdea.canvasData,
          authorId: payload.userId,
          tags: originalIdea.tags,
          category: originalIdea.category,
          license: originalIdea.license,
          visibility: originalIdea.visibility,
          language: originalIdea.language,
          status: originalIdea.status,
          isFork: true,
          forkedFrom: originalIdea.id,
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

      // Create workspace for the forked idea (copying original workspace content)
      const forkedWorkspace = await tx.workspace.create({
        data: {
          name: forkedIdea.title,
          ideaId: forkedIdea.id,
          userId: payload.userId,
          content: originalIdea.workspace?.content || { elements: [], appState: {} },
          isPublic: originalIdea.visibility === 'PUBLIC',
        },
      });

      // Increment fork count on original idea
      await tx.idea.update({
        where: { id: originalIdea.id },
        data: {
          forks: { increment: 1 },
        },
      });

      return { forkedIdea, forkedWorkspace };
    });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: result.forkedIdea,
        workspace: result.forkedWorkspace,
        message: 'Idea forked successfully',
        success: true,
      }),
    };
  } catch (error) {
    console.error('Fork idea error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
