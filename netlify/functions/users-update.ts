/**
 * Netlify Function: Update User Profile
 * PUT /.netlify/functions/users-update
 * 
 * Body: { fullName?, bio?, location?, website?, avatarUrl? }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  requireAuth,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import { sanitizeUser } from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['PUT']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth;

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
      where: { id: auth.userId },
      data: updateData,
    });

    return successResponse(
      sanitizeUser(updatedUser),
      'Profile updated successfully'
    );
  } catch (error) {
    console.error('Update user profile error:', error);
    return ErrorResponses.serverError();
  }
};
