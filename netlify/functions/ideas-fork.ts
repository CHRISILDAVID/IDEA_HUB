/**
 * Netlify Function: Fork Idea
 * POST /.netlify/functions/ideas-fork
 * 
 * CRITICAL CONSTRAINT: Fork creates new workspace
 * Creates a copy of an idea with a new workspace under the forked user's account
 * 
 * Body: { ideaId: string, newTitle?: string, newDescription?: string }
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

    const { ideaId, newTitle, newDescription } = JSON.parse(event.body || '{}');

    if (!ideaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Idea ID is required' }),
      };
    }

    // Fetch the original idea with workspace
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

    // Check if idea is public or user has access
    if (originalIdea.visibility === 'PRIVATE') {
      const isAuthor = originalIdea.authorId === payload.userId;
      const isCollaborator = await prisma.ideaCollaborator.findUnique({
        where: {
          ideaId_userId: {
            ideaId: originalIdea.id,
            userId: payload.userId,
          },
        },
      });

      if (!isAuthor && !isCollaborator) {
        return {
          statusCode: 403,
          body: JSON.stringify({ error: 'Cannot fork a private idea without access' }),
        };
      }
    }

    // Create forked idea and workspace atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create the forked idea
      const forkedIdea = await tx.idea.create({
        data: {
          title: newTitle || `${originalIdea.title} (fork)`,
          description: newDescription || originalIdea.description,
          content: originalIdea.content,
          canvasData: originalIdea.canvasData,
          authorId: payload.userId,
          tags: originalIdea.tags,
          category: originalIdea.category,
          license: originalIdea.license,
          visibility: 'PUBLIC', // Forked ideas are public by default
          language: originalIdea.language,
          status: 'PUBLISHED',
          isFork: true,
          forkedFrom: originalIdea.id,
        },
        include: {
          author: true,
        },
      });

      // Create the workspace for the forked idea
      const forkedWorkspace = await tx.workspace.create({
        data: {
          name: forkedIdea.title,
          ideaId: forkedIdea.id,
          userId: payload.userId,
          content: originalIdea.workspace?.content || { elements: [], appState: {} },
          isPublic: true,
        },
      });

      // Increment fork count on original idea
      await tx.idea.update({
        where: { id: originalIdea.id },
        data: {
          forks: {
            increment: 1,
          },
        },
      });

      return { forkedIdea, forkedWorkspace };
    });

    // Transform user data
    const { passwordHash: _, ...author } = result.forkedIdea.author;

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...result.forkedIdea,
          author,
        },
        success: true,
        message: 'Idea forked successfully',
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
