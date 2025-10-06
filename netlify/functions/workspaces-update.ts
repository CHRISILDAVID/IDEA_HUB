/**
 * Netlify Function: Update Workspace
 * PUT /.netlify/functions/workspaces-update
 * 
 * Only owner and collaborators with EDITOR role can update
 * Body: { 
 *   workspaceId: string, 
 *   content?: any,           // Legacy Excalidraw content
 *   document?: any,          // BlockNote document content  
 *   whiteboard?: any,        // Excalidraw canvas data
 *   name?: string, 
 *   thumbnail?: string, 
 *   isPublic?: boolean,
 *   archived?: boolean       // Soft delete flag
 * }
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';
import {
  checkMethod,
  requireAuth,
  successResponse,
  ErrorResponses,
} from '../../src/lib/middleware';
import {
  canEditWorkspace,
  canChangeWorkspaceVisibility,
  getWorkspaceWithIdea,
  sanitizeUser,
} from '../../src/lib/authorization';

export const handler: Handler = async (event: HandlerEvent) => {
  // Check HTTP method
  const methodError = checkMethod(event, ['PUT']);
  if (methodError) return methodError;

  try {
    // Require authentication
    const auth = requireAuth(event);
    if ('statusCode' in auth) return auth;

    const { workspaceId, content, name, thumbnail, isPublic, document, whiteboard, archived } = JSON.parse(event.body || '{}');

    if (!workspaceId) {
      return ErrorResponses.badRequest('Workspace ID is required');
    }

    // Fetch workspace with idea and collaborators
    const workspace = await getWorkspaceWithIdea(workspaceId);

    if (!workspace) {
      return ErrorResponses.notFound('Workspace');
    }

    // Check edit permission
    const editPermission = canEditWorkspace(workspace, auth.userId);
    if (!editPermission.allowed) {
      return ErrorResponses.forbidden(editPermission.reason);
    }

    // Build update data
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (name !== undefined) updateData.name = name;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (document !== undefined) updateData.document = document;
    if (whiteboard !== undefined) updateData.whiteboard = whiteboard;
    if (archived !== undefined) updateData.archived = archived;
    
    // Only owner can change visibility
    if (isPublic !== undefined) {
      const visibilityPermission = canChangeWorkspaceVisibility(workspace, auth.userId);
      if (visibilityPermission.allowed) {
        updateData.isPublic = isPublic;
      } else if (workspace.userId !== auth.userId) {
        // If user tried to change visibility but isn't owner, return error
        return ErrorResponses.forbidden('Only the workspace owner can change visibility');
      }
    }

    // Update workspace
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      include: {
        idea: {
          include: {
            author: true,
          },
        },
      },
    });

    // Transform data
    const responseData = {
      ...updatedWorkspace,
      idea: {
        ...updatedWorkspace.idea,
        author: sanitizeUser(updatedWorkspace.idea.author),
      },
    };

    return successResponse(responseData, 'Workspace updated successfully');
  } catch (error) {
    console.error('Update workspace error:', error);
    return ErrorResponses.serverError();
  }
};
