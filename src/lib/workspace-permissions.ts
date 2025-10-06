/**
 * Workspace Permission Utilities
 * Implements access control matrix for workspace operations
 */

import type { Idea, Workspace, IdeaCollaborator, User } from '@prisma/client';

export interface WorkspacePermissions {
  canView: boolean;
  canEdit: boolean;
  canInvite: boolean;
  canArchive: boolean;
  canFork: boolean;
}

/**
 * Extended types with relations
 */
type IdeaWithCollaborators = Idea & {
  collaborators: IdeaCollaborator[];
};

type WorkspaceWithIdea = Workspace & {
  idea: IdeaWithCollaborators;
};

/**
 * Get comprehensive workspace permissions for a user
 * 
 * Permission Matrix:
 * - Owner: Full access (view, edit, invite, archive, N/A fork)
 * - Editor collaborator: View, edit (both public and private)
 * - Viewer collaborator: View only (both public and private)
 * - Authenticated non-owner: View public, fork public
 * - Anonymous: View public only
 */
export function getWorkspacePermissions(
  workspace: WorkspaceWithIdea,
  currentUser: User | null,
  collaborators: IdeaCollaborator[]
): WorkspacePermissions {
  const idea = workspace.idea;
  const isOwner = currentUser && idea.authorId === currentUser.id;
  const collaboration = collaborators.find(c => c.userId === currentUser?.id);
  const isCollaborator = !!collaboration;
  const collaboratorRole = collaboration?.role;
  
  const isPublic = idea.visibility === 'PUBLIC';
  const isPrivate = idea.visibility === 'PRIVATE';
  const isAuthenticated = !!currentUser;

  return {
    // ── View Permissions ──────────────────────────────────
    canView: 
      isPublic ||                          // Anyone can view public ideas
      isOwner ||                           // Owner can always view
      isCollaborator,                      // Collaborators can view
    
    // ── Edit Permissions ──────────────────────────────────
    canEdit:
      isOwner ||                           // Owner can always edit
      (isCollaborator && collaboratorRole === 'EDITOR'), // Editors can edit
    
    // ── Invite Permissions ────────────────────────────────
    // Only owner can invite collaborators, max 3 total
    canInvite:
      isOwner && collaborators.length < 3,
    
    // ── Archive Permissions ───────────────────────────────
    // Only owner can archive workspace
    canArchive:
      isOwner === true,
    
    // ── Fork Permissions ──────────────────────────────────
    // Can fork if:
    // - Idea is public AND
    // - User is authenticated AND
    // - User is not the owner (can't fork own idea)
    canFork:
      isPublic && isAuthenticated && !isOwner,
  };
}

/**
 * Check if user can view workspace (simplified version)
 */
export function canViewWorkspace(
  workspace: WorkspaceWithIdea,
  currentUser: User | null
): boolean {
  const permissions = getWorkspacePermissions(
    workspace,
    currentUser,
    workspace.idea.collaborators
  );
  return permissions.canView;
}

/**
 * Check if user can edit workspace (simplified version)
 */
export function canEditWorkspace(
  workspace: WorkspaceWithIdea,
  currentUser: User | null
): boolean {
  const permissions = getWorkspacePermissions(
    workspace,
    currentUser,
    workspace.idea.collaborators
  );
  return permissions.canEdit;
}

/**
 * Check if user can archive workspace (simplified version)
 */
export function canArchiveWorkspace(
  workspace: WorkspaceWithIdea,
  currentUser: User | null
): boolean {
  const permissions = getWorkspacePermissions(
    workspace,
    currentUser,
    workspace.idea.collaborators
  );
  return permissions.canArchive;
}

/**
 * Check if user can fork the idea/workspace (simplified version)
 */
export function canForkWorkspace(
  workspace: WorkspaceWithIdea,
  currentUser: User | null
): boolean {
  const permissions = getWorkspacePermissions(
    workspace,
    currentUser,
    workspace.idea.collaborators
  );
  return permissions.canFork;
}
