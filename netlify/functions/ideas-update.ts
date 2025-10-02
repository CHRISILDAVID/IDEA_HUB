/**
 * Netlify Function: Update Idea
 * PUT /.netlify/functions/ideas-update
 * 
 * Only the author can update the idea
 * Body: { ideaId: string, ...updates }
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

    // Fetch the idea to check ownership
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Idea not found' }),
      };
    }

    // Only the author can update
    if (idea.authorId !== payload.userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Only the author can update this idea' }),
      };
    }

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (canvasData !== undefined) updateData.canvasData = canvasData;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (license !== undefined) updateData.license = license;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (language !== undefined) updateData.language = language;
    if (status !== undefined) updateData.status = status;

    // Update the idea
    const updatedIdea = await prisma.idea.update({
      where: { id: ideaId },
      data: updateData,
      include: {
        author: true,
      },
    });

    // Transform user data
    const { passwordHash: _, ...author } = updatedIdea.author;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...updatedIdea,
          author,
        },
        success: true,
        message: 'Idea updated successfully',
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
