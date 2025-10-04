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
import {
  checkMethod,
  requireAuth,
  validateBodyFields,
  createdResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import {
  canForkIdea,
  getIdeaWithCollaborators,
  sanitizeUser,
} from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['POST']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth;

    const body = JSON.parse(event.body || '{}');
    const { ideaId, newTitle, newDescription } = body;

    // Validate required fields
    const validationError = validateBodyFields(body, ['ideaId']);
    if (validationError) return validationError;

    // Fetch the original idea with workspace and collaborators
    const originalIdeaWithCollabs = await getIdeaWithCollaborators(ideaId);

    if (!originalIdeaWithCollabs) {
      return ErrorResponses.notFound('Idea');
    }

    // Fetch workspace separately
    const originalIdea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        workspace: true,
      },
    });

    if (!originalIdea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check fork permission
    const forkPermission = canForkIdea(originalIdeaWithCollabs, auth.userId);
    if (!forkPermission.allowed) {
      return ErrorResponses.forbidden(forkPermission.reason);
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
          authorId: auth.userId,
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
          userId: auth.userId,
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

      // Create notification for original author
      await tx.notification.create({
        data: {
          userId: originalIdea.authorId,
          type: 'FORK',
          message: `Someone forked your idea "${originalIdea.title}"`,
          relatedUserId: auth.userId,
          relatedIdeaId: forkedIdea.id,
          relatedUrl: `/ideas/${forkedIdea.id}`,
        },
      });

      return { forkedIdea, forkedWorkspace };
    });

    // Transform response data
    const responseData = {
      ...result.forkedIdea,
      author: sanitizeUser(result.forkedIdea.author),
      workspace: result.forkedWorkspace,
    };

    return createdResponse(responseData, 'Idea forked successfully');
  } catch (error) {
    console.error('Fork idea error:', error);
    return ErrorResponses.serverError();
  }
};
