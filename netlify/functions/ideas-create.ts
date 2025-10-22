/**
 * Netlify Function: Create Idea with Workspace
 * POST /.netlify/functions/ideas-create
 * 
 * CRITICAL CONSTRAINT: One workspace per idea
 * Creates an idea and its associated workspace atomically
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

    const {
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

    // Validation
    if (!title || !description || !content || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title, description, content, category' }),
      };
    }

    // Create idea and workspace atomically using a transaction
    // This ensures the constraint: one workspace per idea
    const result = await prisma.$transaction(async (tx) => {
      // Create the idea
      const idea = await tx.idea.create({
        data: {
          title,
          description,
          content,
          canvasData: canvasData || null,
          authorId: payload.userId,
          tags: tags || [],
          category,
          license: license || 'MIT',
          visibility: visibility || 'PUBLIC',
          language: language || null,
          status: status || 'PUBLISHED',
        },
        include: {
          author: true,
        },
      });

      // Create the workspace with the same name as the idea
      const workspace = await tx.workspace.create({
        data: {
          name: title,
          ideaId: idea.id,
          userId: payload.userId,
          document: {},
          whiteboard: canvasData ? JSON.parse(canvasData) : { elements: [], appState: {} },
          isPublic: visibility === 'PUBLIC',
        },
      });

      return { idea, workspace };
    });

    // Transform user data
    const { passwordHash: _, ...author } = result.idea.author;

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...result.idea,
          author,
        },
        success: true,
        message: 'Idea and workspace created successfully',
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
