/**
 * Netlify Function: Delete Idea
 * DELETE /.netlify/functions/ideas-delete?id={ideaId}
 * 
 * Only the author can delete the idea
 * Cascade deletes workspace, collaborators, comments, etc.
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  validateQueryParams,
  requireAuth,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import { canDeleteIdea } from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['DELETE']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth;

    // Validate required parameters
    const paramsError = validateQueryParams(event, ['id']);
    if (paramsError) return paramsError;

    const ideaId = event.queryStringParameters!.id;

    // Fetch the idea to check ownership
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check delete permission
    const permission = canDeleteIdea(idea, auth.userId);
    if (!permission.allowed) {
      return ErrorResponses.forbidden(permission.reason);
    }

    // Delete the idea (cascade will handle workspace, collaborators, etc.)
    await prisma.idea.delete({
      where: { id: ideaId },
    });

    return successResponse(
      { ideaId },
      'Idea deleted successfully'
    );
  } catch (error) {
    console.error('Delete idea error:', error);
    return ErrorResponses.serverError();
  }
};
