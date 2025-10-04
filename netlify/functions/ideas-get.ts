/**
 * Netlify Function: Get Single Idea
 * GET /.netlify/functions/ideas-get?id={ideaId}
 * 
 * Access control:
 * - Public ideas: anyone can view
 * - Private ideas: only author and collaborators can view
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
  getIdeaWithCollaborators,
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

    const ideaId = event.queryStringParameters!.id;

    // Optional authentication (works with or without auth)
    const auth = optionalAuth(event);
    const userId = auth?.userId || null;

    // Fetch the idea with relations
    const idea = await getIdeaWithCollaborators(ideaId);

    if (!idea) {
      return ErrorResponses.notFound('Idea');
    }

    // Check access permissions
    const permission = canViewIdea(idea, userId);
    if (!permission.allowed) {
      return userId 
        ? ErrorResponses.forbidden(permission.reason)
        : ErrorResponses.unauthorized(permission.reason);
    }

    // Fetch additional data
    const [author, collaborators, counts, isStarred] = await Promise.all([
      prisma.user.findUnique({ where: { id: idea.authorId } }),
      prisma.ideaCollaborator.findMany({
        where: { ideaId: idea.id },
        include: { user: true },
      }),
      prisma.idea.findUnique({
        where: { id: idea.id },
        select: {
          _count: {
            select: {
              starredBy: true,
              comments: true,
              forkIdeas: true,
            },
          },
        },
      }),
      userId
        ? prisma.star.findUnique({
            where: {
              userId_ideaId: {
                userId: userId,
                ideaId: idea.id,
              },
            },
          })
        : Promise.resolve(null),
    ]);

    if (!author) {
      return ErrorResponses.serverError('Idea author not found');
    }

    // Transform data
    const transformedCollaborators = collaborators.map((collab) => ({
      ...collab,
      user: sanitizeUser(collab.user),
    }));

    const responseData = {
      ...idea,
      author: sanitizeUser(author),
      collaborators: transformedCollaborators,
      stars: counts?._count.starredBy || 0,
      comments: counts?._count.comments || 0,
      forks: counts?._count.forkIdeas || 0,
      isStarred: !!isStarred,
    };

    return successResponse(responseData);
  } catch (error) {
    console.error('Get idea error:', error);
    return ErrorResponses.serverError();
  }
};
