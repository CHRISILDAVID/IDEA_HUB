/**
 * Netlify Function: Check Workspace Permissions
 * GET /.netlify/functions/workspace-permissions?ideaId={ideaId}
 * 
 * Returns workspace data and user permissions for viewing/editing
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  optionalAuth,
  validateQueryParams,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import {
  canViewIdea,
  canEditIdea,
  isIdeaOwner,
  isIdeaCollaborator,
  hasIdeaRole,
  sanitizeUser,
} from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['GET']);
  if (methodError) return methodError;

  try {
    // Optional authentication (public ideas don't require auth)
    const auth = optionalAuth(event);

    // Validate query parameters
    const params = event.queryStringParameters;
    const validationError = validateQueryParams(params, ['ideaId']);
    if (validationError) return validationError;

    const { ideaId } = params!;

    // Fetch idea with workspace and collaborators
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        workspace: true,
        collaborators: {
          include: {
            user: true,
          },
        },
        author: true,
      },
    });

    if (!idea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check view permission
    const viewPermission = canViewIdea(idea, auth.userId);
    if (!viewPermission.allowed) {
      return auth.userId
        ? ErrorResponses.forbidden(viewPermission.reason)
        : ErrorResponses.unauthorized(viewPermission.reason);
    }

    // Determine permissions
    const isOwner = isIdeaOwner(idea, auth.userId);
    const isCollaborator = isIdeaCollaborator(idea, auth.userId);
    const canEdit = canEditIdea(idea, auth.userId).allowed;
    const canView = viewPermission.allowed;

    // Prepare response
    const responseData = {
      idea: {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        visibility: idea.visibility,
        status: idea.status,
        author: sanitizeUser(idea.author),
        collaborators: idea.collaborators.map((c) => ({
          id: c.id,
          role: c.role,
          user: sanitizeUser(c.user),
        })),
      },
      workspace: idea.workspace ? {
        id: idea.workspace.id,
        name: idea.workspace.name,
        document: idea.workspace.document,
        whiteboard: idea.workspace.whiteboard,
        isPublic: idea.workspace.isPublic,
        createdAt: idea.workspace.createdAt,
        updatedAt: idea.workspace.updatedAt,
      } : null,
      permissions: {
        canView,
        canEdit,
        isOwner,
        isCollaborator,
        role: isOwner ? 'OWNER' : (
          isCollaborator 
            ? idea.collaborators.find((c) => c.userId === auth.userId)?.role || 'VIEWER'
            : null
        ),
      },
    };

    return successResponse(responseData, 'Permissions retrieved successfully');
  } catch (error) {
    console.error('Workspace permissions error:', error);
    return ErrorResponses.serverError();
  }
};
