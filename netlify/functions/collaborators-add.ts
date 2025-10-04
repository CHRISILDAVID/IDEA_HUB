/**
 * Netlify Function: Add Collaborator to Idea
 * POST /.netlify/functions/collaborators-add
 * 
 * CRITICAL CONSTRAINT: Maximum 3 collaborators per idea
 * 
 * Body: { ideaId: string, userId: string, role?: 'OWNER' | 'EDITOR' | 'VIEWER' }
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
  canAddCollaborators,
  canAddMoreCollaborators,
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
    const { ideaId, userId, role } = body;

    // Validate required fields
    const validationError = validateBodyFields(body, ['ideaId', 'userId']);
    if (validationError) return validationError;

    // Fetch the idea with collaborators
    const idea = await getIdeaWithCollaborators(ideaId);

    if (!idea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check if current user can add collaborators
    const addPermission = canAddCollaborators(idea, auth.userId);
    if (!addPermission.allowed) {
      return ErrorResponses.forbidden(addPermission.reason);
    }

    // Check if user is trying to add themselves
    if (userId === auth.userId) {
      return ErrorResponses.badRequest('Cannot add yourself as a collaborator');
    }

    // Check if already has max collaborators
    const maxPermission = canAddMoreCollaborators(idea);
    if (!maxPermission.allowed) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: maxPermission.reason,
          currentCount: idea.collaborators.length,
          maxAllowed: 3,
        }),
      };
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return ErrorResponses.notFound('User');
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
      return ErrorResponses.badRequest('User is already a collaborator');
    }

    // Add the collaborator
    const collaborator = await prisma.ideaCollaborator.create({
      data: {
        ideaId,
        userId,
        role: role || 'VIEWER',
      },
      include: {
        user: true,
      },
    });

    // Create notification for the new collaborator
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'MENTION',
        message: `You have been added as a collaborator to "${idea.title}"`,
        relatedUserId: auth.userId,
        relatedIdeaId: ideaId,
        relatedUrl: `/ideas/${ideaId}`,
      },
    });

    // Transform response data
    const responseData = {
      ...collaborator,
      user: sanitizeUser(collaborator.user),
    };

    return createdResponse(
      {
        ...responseData,
        collaboratorCount: idea.collaborators.length + 1,
        maxAllowed: 3,
      },
      'Collaborator added successfully'
    );
  } catch (error) {
    console.error('Add collaborator error:', error);
    return ErrorResponses.serverError();
  }
};
