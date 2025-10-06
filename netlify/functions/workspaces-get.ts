/**
 * Netlify Function: Get Single Workspace
 * GET /.netlify/functions/workspaces-get?id={workspaceId}
 * 
 * Access control:
 * - Public workspaces: anyone can view
 * - Private workspaces: only owner and idea collaborators can view
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
    const paramsError = validateQueryParams(event, ['id']);
    if (paramsError) return paramsError;

    const workspaceId = event.queryStringParameters!.id;

    // Optional authentication
    const auth = optionalAuth(event);
    const userId = auth?.userId || null;

    // Fetch workspace with related idea and collaborators
    const workspace = await getWorkspaceWithIdea(workspaceId);

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
      // Include new fields: document, whiteboard, archived
      document: workspace.document,
      whiteboard: workspace.whiteboard,
      archived: workspace.archived,
      idea: {
        ...workspace.idea,
        author: sanitizeUser(workspace.idea.author),
        collaborators: transformedCollaborators,
      },
    };

    return successResponse(responseData);
  } catch (error) {
    console.error('Get workspace error:', error);
    return ErrorResponses.serverError();
  }
};
