/**
 * Netlify Function: List Ideas
 * GET /.netlify/functions/ideas-list
 * 
 * Query parameters:
 * - visibility: filter by public/private (default: public only)
 * - authorId: filter by author
 * - category: filter by category
 * - tags: filter by tags (comma-separated)
 * - search: search in title/description
 * - limit: number of results (default: 30)
 * - offset: pagination offset (default: 0)
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Optional authentication (some queries need it)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);
    const payload = token ? verifyToken(token) : null;

    // Parse query parameters
    const params = event.queryStringParameters || {};
    const visibility = params.visibility as 'PUBLIC' | 'PRIVATE' | undefined;
    const authorId = params.authorId;
    const category = params.category;
    const tags = params.tags?.split(',').filter(Boolean);
    const search = params.search;
    const limit = Math.min(parseInt(params.limit || '30'), 100);
    const offset = parseInt(params.offset || '0');

    // Build where clause
    const where: any = {
      status: 'PUBLISHED', // Only show published ideas
    };

    // Visibility filter
    if (visibility) {
      where.visibility = visibility;
    } else {
      // Default: only show public ideas unless authenticated user is viewing their own
      where.visibility = 'PUBLIC';
    }

    // If viewing private ideas, must be authenticated and be the author
    if (visibility === 'PRIVATE') {
      if (!payload) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Authentication required to view private ideas' }),
        };
      }
      where.authorId = payload.userId;
    }

    // Author filter
    if (authorId) {
      where.authorId = authorId;
      // If viewing someone else's ideas, only show public ones
      if (payload?.userId !== authorId) {
        where.visibility = 'PUBLIC';
      }
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch ideas with author
    const ideas = await prisma.idea.findMany({
      where,
      include: {
        author: true,
        _count: {
          select: {
            starredBy: true,
            comments: true,
            forkIdeas: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.idea.count({ where });

    // Transform data (remove password hash from authors)
    const transformedIdeas = ideas.map((idea) => {
      const { passwordHash: _, ...author } = idea.author;
      const { _count, ...ideaData } = idea;
      
      return {
        ...ideaData,
        author,
        stars: _count.starredBy,
        comments: _count.comments,
        forks: _count.forkIdeas,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: transformedIdeas,
        total,
        limit,
        offset,
        success: true,
      }),
    };
  } catch (error) {
    console.error('List ideas error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
