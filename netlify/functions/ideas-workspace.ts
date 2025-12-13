/**
 * Netlify Function: Get Idea with Workspace
 * GET /.netlify/functions/ideas-workspace?ideaId={ideaId}
 * 
 * This endpoint supports the integrated routing pattern where users navigate
 * to an idea's workspace using the idea ID. It fetches both the idea metadata
 * and its associated workspace content.
 * 
 * Use case: When routing to /workspace/idea/[ideaId], this endpoint provides
 * all necessary data to render the workspace editor.
 * 
 * Access control:
 * - Public ideas/workspaces: anyone can view
 * - Private ideas/workspaces: only author and collaborators can view
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
  canViewIdea,
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

    // Optional authentication (works with or without auth)
    const auth = optionalAuth(event);
    const userId = auth?.userId || null;

    // Fetch idea with workspace and author in a single query
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: true,
        workspace: true,
        collaborators: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!idea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check access permissions using the idea's visibility
    const permission = canViewIdea(idea, userId);
    if (!permission.allowed) {
      return userId
        ? ErrorResponses.forbidden(permission.reason)
        : ErrorResponses.unauthorized(permission.reason);
    }

    // Workspace should always exist (created atomically with idea)
    // But handle edge case for backward compatibility
    if (!idea.workspace) {
      return ErrorResponses.notFound('Workspace for this idea');
    }

    // Transform collaborators data
    const transformedCollaborators = idea.collaborators.map((collab) => ({
      ...collab,
      user: sanitizeUser(collab.user),
    }));

    // Build response with both idea and workspace data
    const responseData = {
      idea: {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        content: idea.content,
        canvasData: idea.canvasData,
        tags: idea.tags,
        category: idea.category,
        license: idea.license,
        version: idea.version,
        stars: idea.stars,
        forks: idea.forks,
        visibility: idea.visibility,
        status: idea.status,
        createdAt: idea.createdAt,
        updatedAt: idea.updatedAt,
        author: sanitizeUser(idea.author),
        collaborators: transformedCollaborators,
      },
      workspace: {
        id: idea.workspace.id,
        name: idea.workspace.name,
        ideaId: idea.workspace.ideaId,
        userId: idea.workspace.userId,
        document: idea.workspace.document,
        whiteboard: idea.workspace.whiteboard,
        thumbnail: idea.workspace.thumbnail,
        isPublic: idea.workspace.isPublic,
        archived: idea.workspace.archived,
        createdAt: idea.workspace.createdAt,
        updatedAt: idea.workspace.updatedAt,
      },
      // Provide workspaceId at top level for easy access
      workspaceId: idea.workspace.id,
    };

    return successResponse(responseData);
  } catch (error) {
    console.error('Get idea with workspace error:', error);
    return ErrorResponses.serverError();
  }
};
