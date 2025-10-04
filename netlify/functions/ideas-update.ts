/**
 * Netlify Function: Update Idea
 * PUT /.netlify/functions/ideas-update
 * 
 * Only the author can update the idea
 * Body: { ideaId: string, ...updates }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  requireAuth,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import {
  canEditIdea,
  sanitizeUser,
} from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['PUT']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth; // Auth failed, return error response

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
      return ErrorResponses.badRequest('Idea ID is required');
    }

    // Fetch the idea to check ownership
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check edit permission
    const permission = canEditIdea(idea, auth.userId);
    if (!permission.allowed) {
      return ErrorResponses.forbidden(permission.reason);
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
    const responseData = {
      ...updatedIdea,
      author: sanitizeUser(updatedIdea.author),
    };

    return successResponse(responseData, 'Idea updated successfully');
  } catch (error) {
    console.error('Update idea error:', error);
    return ErrorResponses.serverError();
  }
};
