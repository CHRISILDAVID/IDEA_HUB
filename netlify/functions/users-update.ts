/**
 * Netlify Function: Update User Profile
 * PUT /.netlify/functions/users-update
 * 
 * Body: { fullName?, bio?, location?, website?, avatarUrl? }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import { verifyToken, extractTokenFromHeader } from '../../src/lib/auth';

export const handler: Handler = async (event: HandlerEvent) => {
  // Only allow PUT
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Verify authentication
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const { fullName, bio, location, website, avatarUrl } = JSON.parse(event.body || '{}');

    // Build update data
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
    });

    // Transform data (remove password hash)
    const { passwordHash: _, ...userData } = updatedUser;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: userData,
        success: true,
        message: 'Profile updated successfully',
      }),
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
