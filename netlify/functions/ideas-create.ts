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

    // Validation - title, description, category are required
    // content can be empty for drafts
    if (!title || !description || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: title, description, category' }),
      };
    }

    // Create idea and workspace atomically using a transaction
    // This ensures the constraint: one workspace per idea (1:1 relationship)
    // CRITICAL: Both records must be created together - one cannot exist without the other
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create the idea (metadata layer)
      const idea = await tx.idea.create({
        data: {
          title,
          description,
          content: content || '',
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

      // Step 2: Create the workspace (file system layer) linked to the idea
      // The workspace serves as the canvas/document storage for the idea
      const workspace = await tx.workspace.create({
        data: {
          name: title,
          ideaId: idea.id,
          userId: payload.userId,
          // Initialize document and whiteboard with empty/default content
          document: {}, // EditorJS empty state
          whiteboard: { elements: [], appState: {} }, // Excalidraw empty state
          isPublic: visibility === 'PUBLIC',
          archived: false,
        },
      });

      return { idea, workspace };
    });

    // Transform user data (remove sensitive fields)
    const { passwordHash: _, ...author } = result.idea.author;

    // Return both idea and workspace data with the workspace ID
    // Frontend can use workspaceId to construct route: /workspace/[workspaceId]
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...result.idea,
          author,
          workspace: {
            id: result.workspace.id,
            name: result.workspace.name,
            ideaId: result.workspace.ideaId,
          },
        },
        workspaceId: result.workspace.id,
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
