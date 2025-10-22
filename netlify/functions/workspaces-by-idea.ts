/**
 * Netlify Function: Get Workspace by Idea ID
 * GET /.netlify/functions/workspaces-by-idea?ideaId={ideaId}
 * 
 * Access control:
 * - Public ideas: anyone can view the workspace
 * - Private ideas: only owner and idea collaborators can view
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  validateQueryParams,
  optionalAuth,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import {
  canViewWorkspace,
  getWorkspaceWithIdea,
  sanitizeUser,
} from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['GET']);
  if (methodError) return methodError;

  try {
    // Validate required parameters
    const paramsError = validateQueryParams(event, ['ideaId']);
    if (paramsError) return paramsError;

    const ideaId = event.queryStringParameters!.ideaId;

    // Optional authentication
    const auth = optionalAuth(event);
    const userId = auth?.userId || null;

    // Fetch workspace by idea ID
    const workspace = await prisma.workspace.findUnique({
      where: { ideaId },
      include: {
        idea: {
          include: {
            author: true,
            collaborators: {
              include: {
                user: true,
              },
            },
          },
        },
        owner: true,
      },
    });

    if (!workspace) {
      return ErrorResponses.notFound('Workspace');
    }

    // Check access permissions
    const permission = canViewWorkspace(workspace, userId);
    if (!permission.allowed) {
      return userId
        ? ErrorResponses.forbidden(permission.reason)
        : ErrorResponses.unauthorized(permission.reason);
    }

    // Transform data
    const transformedCollaborators = workspace.idea.collaborators.map((collab) => ({
      ...collab,
      user: sanitizeUser(collab.user),
    }));

    const responseData = {
      ...workspace,
      idea: {
        ...workspace.idea,
        author: sanitizeUser(workspace.idea.author),
        collaborators: transformedCollaborators,
      },
      owner: sanitizeUser(workspace.owner),
    };

    return successResponse(responseData);
  } catch (error) {
    console.error('Get workspace by idea error:', error);
    return ErrorResponses.serverError();
  }
};
