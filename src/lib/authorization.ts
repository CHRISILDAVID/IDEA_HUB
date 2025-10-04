/**
 * Authorization Helpers
 * Reusable permission checking functions for ideas, workspaces, and collaborators
 */

import prisma from './prisma';
import type { JWTPayload } from './auth';
import type { Idea, Workspace, IdeaCollaborator, CollaboratorRole } from '@prisma/client';

/**
 * Permission check result
 */
export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Extended types with relations
 */
export type IdeaWithCollaborators = Idea & {
  collaborators: IdeaCollaborator[];
};

export type WorkspaceWithIdea = Workspace & {
  idea: IdeaWithCollaborators;
};

/**
 * Check if user is the owner of an idea
 */
export function isIdeaOwner(idea: Idea, userId: string): boolean {
  return idea.authorId === userId;
}

/**
 * Check if user is a collaborator on an idea
 */
export function isIdeaCollaborator(
  idea: IdeaWithCollaborators,
  userId: string
): boolean {
  return idea.collaborators.some(c => c.userId === userId);
}

/**
 * Check if user has a specific role on an idea
 */
export function hasIdeaRole(
  idea: IdeaWithCollaborators,
  userId: string,
  requiredRole: CollaboratorRole | CollaboratorRole[]
): boolean {
  const collaborator = idea.collaborators.find(c => c.userId === userId);
  if (!collaborator) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(collaborator.role);
}

/**
 * Check if user can view an idea (public or owner/collaborator)
 */
export function canViewIdea(
  idea: IdeaWithCollaborators,
  userId: string | null
): PermissionResult {
  // Public ideas can be viewed by anyone
  if (idea.visibility === 'PUBLIC') {
    return { allowed: true };
  }

  // Private ideas require authentication
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required to view this idea',
    };
  }

  // Check if user is owner or collaborator
  if (isIdeaOwner(idea, userId) || isIdeaCollaborator(idea, userId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'You do not have permission to view this idea',
  };
}

/**
 * Check if user can edit an idea (only owner)
 */
export function canEditIdea(idea: Idea, userId: string): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (isIdeaOwner(idea, userId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Only the idea author can update this idea',
  };
}

/**
 * Check if user can delete an idea (only owner)
 */
export function canDeleteIdea(idea: Idea, userId: string): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (isIdeaOwner(idea, userId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Only the idea author can delete this idea',
  };
}

/**
 * Check if user can view a workspace (public or owner/collaborator)
 */
export function canViewWorkspace(
  workspace: WorkspaceWithIdea,
  userId: string | null
): PermissionResult {
  // Public workspaces can be viewed by anyone
  if (workspace.isPublic) {
    return { allowed: true };
  }

  // Private workspaces require authentication
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required to view this workspace',
    };
  }

  // Check if user is owner
  if (workspace.userId === userId) {
    return { allowed: true };
  }

  // Check if user is a collaborator on the related idea
  if (isIdeaCollaborator(workspace.idea, userId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'You do not have permission to view this workspace',
  };
}

/**
 * Check if user can edit a workspace (owner or EDITOR/OWNER role collaborators)
 */
export function canEditWorkspace(
  workspace: WorkspaceWithIdea,
  userId: string
): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  // Owner can always edit
  if (workspace.userId === userId) {
    return { allowed: true };
  }

  // Collaborators with EDITOR or OWNER role can edit
  if (hasIdeaRole(workspace.idea, userId, ['EDITOR', 'OWNER'])) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'You do not have permission to edit this workspace',
  };
}

/**
 * Check if user can change workspace visibility (only owner)
 */
export function canChangeWorkspaceVisibility(
  workspace: Workspace,
  userId: string
): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (workspace.userId === userId) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Only the workspace owner can change visibility',
  };
}

/**
 * Check if user can add collaborators to an idea (only owner)
 */
export function canAddCollaborators(
  idea: Idea,
  userId: string
): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }

  if (isIdeaOwner(idea, userId)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'Only the idea author can add collaborators',
  };
}

/**
 * Check if adding a new collaborator would exceed the max limit (3)
 */
export function canAddMoreCollaborators(
  idea: IdeaWithCollaborators
): PermissionResult {
  const MAX_COLLABORATORS = 3;
  const currentCount = idea.collaborators.length;

  if (currentCount >= MAX_COLLABORATORS) {
    return {
      allowed: false,
      reason: `Maximum of ${MAX_COLLABORATORS} collaborators allowed per idea`,
    };
  }

  return { allowed: true };
}

/**
 * Check if user can fork an idea (must be authenticated, idea must be public or user has access)
 */
export function canForkIdea(
  idea: IdeaWithCollaborators,
  userId: string | null
): PermissionResult {
  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required to fork ideas',
    };
  }

  // Can't fork your own idea
  if (isIdeaOwner(idea, userId)) {
    return {
      allowed: false,
      reason: 'Cannot fork your own idea',
    };
  }

  // Must have view access to fork
  const viewPermission = canViewIdea(idea, userId);
  if (!viewPermission.allowed) {
    return viewPermission;
  }

  return { allowed: true };
}

/**
 * Fetch idea with collaborators for permission checks
 */
export async function getIdeaWithCollaborators(
  ideaId: string
): Promise<IdeaWithCollaborators | null> {
  return await prisma.idea.findUnique({
    where: { id: ideaId },
    include: {
      collaborators: true,
    },
  });
}

/**
 * Fetch workspace with idea and collaborators for permission checks
 */
export async function getWorkspaceWithIdea(
  workspaceId: string
): Promise<WorkspaceWithIdea | null> {
  return await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      idea: {
        include: {
          collaborators: true,
        },
      },
    },
  });
}

/**
 * Remove password hash from user object
 */
export function sanitizeUser<T extends { passwordHash?: string | null }>(
  user: T
): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...sanitized } = user;
  return sanitized;
}

/**
 * Remove password hashes from array of users
 */
export function sanitizeUsers<T extends { passwordHash?: string | null }>(
  users: T[]
): Omit<T, 'passwordHash'>[] {
  return users.map(sanitizeUser);
}
