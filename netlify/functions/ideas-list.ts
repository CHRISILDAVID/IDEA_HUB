/**
 * Netlify Function: List Ideas
 * GET /.netlify/functions/ideas-list?category=web&sort=newest&query=react
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { Prisma } from '@prisma/client';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const params = event.queryStringParameters || {};
    const {
      category,
      language,
      query,
      sort = 'newest',
      page = '1',
      limit = '20',
    } = params;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: Prisma.IdeaWhereInput = {
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (language && language !== 'all') {
      where.language = language;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    let orderBy: Prisma.IdeaOrderByWithRelationInput = {};
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most-stars':
        orderBy = { stars: 'desc' };
        break;
      case 'most-forks':
        orderBy = { forks: 'desc' };
        break;
      case 'recently-updated':
        orderBy = { updatedAt: 'desc' };
        break;
      default: // newest
        orderBy = { createdAt: 'desc' };
    }

    // Fetch ideas
    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              comments: true,
              starredBy: true,
            },
          },
        },
      }),
      prisma.idea.count({ where }),
    ]);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: ideas,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
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
