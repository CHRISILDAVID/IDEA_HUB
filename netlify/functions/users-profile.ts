/**
 * Netlify Function: Get User Profile
 * GET /.netlify/functions/users-profile?userId={userId} or ?username={username}
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const userId = event.queryStringParameters?.userId;
    const username = event.queryStringParameters?.username;

    if (!userId && !username) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User ID or username is required' }),
      };
    }

    // Build where clause
    const where: any = {};
    if (userId) {
      where.id = userId;
    } else if (username) {
      where.username = username;
    }

    // Fetch user with counts
    const user = await prisma.user.findUnique({
      where,
      include: {
        _count: {
          select: {
            ideas: true,
            followedBy: true,
            following: true,
            stars: true,
          },
        },
      },
    });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Transform data (remove password hash)
    const { passwordHash: _, _count, ...userData } = user;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          ...userData,
          publicRepos: _count.ideas,
          followers: _count.followedBy,
          following: _count.following,
          stars: _count.stars,
        },
        success: true,
      }),
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
