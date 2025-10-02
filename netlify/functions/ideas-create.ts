/**
 * Netlify Function: Create Idea with Workspace
 * POST /.netlify/functions/ideas-create
 * 
 * CRITICAL CONSTRAINT: Creates idea and workspace atomically (one workspace per idea)
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

    const {
      title,
      description,
      content,
      canvasData,
      tags = [],
      category,
      license = 'MIT',
      visibility = 'PUBLIC',
      language,
      status = 'PUBLISHED',
    } = JSON.parse(event.body || '{}');

    // Validation
    if (!title || !description || !content || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title, description, content, category' }),
      };
    }

    // ATOMIC TRANSACTION: Create idea and workspace together
    const result = await prisma.$transaction(async (tx) => {
      // Create the idea
      const idea = await tx.idea.create({
        data: {
          title,
          description,
          content,
          canvasData,
          authorId: payload.userId,
          tags,
          category,
          license,
          visibility,
          language,
          status,
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

      // Create the workspace for this idea
      const workspace = await tx.workspace.create({
        data: {
          name: title, // Workspace name matches idea title
          ideaId: idea.id,
          userId: payload.userId,
          content: canvasData ? JSON.parse(canvasData) : { elements: [], appState: {} },
          isPublic: visibility === 'PUBLIC',
        },
      });

      return { idea, workspace };
    });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: result.idea,
        workspace: result.workspace,
        message: 'Idea and workspace created successfully',
        success: true,
      }),
    };
  } catch (error) {
    console.error('Create idea error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
