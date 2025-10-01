import { prisma } from '../prisma';
import { ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';

interface Workspace {
  id: string;
  name: string;
  userId: string;
  content: any;
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceCollaborator {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
}

export class WorkspacesService {
  /**
   * Get workspaces for a user
   */
  static async getUserWorkspaces(userId: string): Promise<ApiResponse<Workspace[]>> {
    try {
      const workspaces = await prisma.workspace.findMany({
        where: {
          OR: [
            { userId },
            {
              collaborators: {
                some: { userId },
              },
            },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          user: true,
          collaborators: {
            include: { user: true },
          },
        },
      });

      const transformedWorkspaces = workspaces.map(workspace =>
        this.transformPrismaWorkspace(workspace)
      );

      return {
        data: transformedWorkspaces,
        message: 'Workspaces retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting workspaces:', error);
      throw error;
    }
  }

  /**
   * Get a workspace by ID
   */
  static async getWorkspace(workspaceId: string, userId?: string): Promise<ApiResponse<Workspace>> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          user: true,
          collaborators: {
            include: { user: true },
          },
        },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      // Check access permissions
      if (!workspace.isPublic && userId) {
        const hasAccess =
          workspace.userId === userId ||
          workspace.collaborators.some(c => c.userId === userId);

        if (!hasAccess) {
          throw new Error('Access denied to this workspace');
        }
      }

      return {
        data: this.transformPrismaWorkspace(workspace),
        message: 'Workspace retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting workspace:', error);
      throw error;
    }
  }

  /**
   * Create a new workspace
   */
  static async createWorkspace(
    userId: string,
    name: string,
    content?: any,
    isPublic = false
  ): Promise<ApiResponse<Workspace>> {
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name,
          userId,
          content: content || { elements: [], appState: {} },
          isPublic,
        },
        include: {
          user: true,
        },
      });

      // Create owner collaborator record
      await prisma.workspaceCollaborator.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: 'owner',
        },
      });

      return {
        data: this.transformPrismaWorkspace(workspace),
        message: 'Workspace created successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  /**
   * Update a workspace
   */
  static async updateWorkspace(
    workspaceId: string,
    userId: string,
    data: Partial<Workspace>
  ): Promise<ApiResponse<Workspace>> {
    try {
      // Check if user has edit permissions
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          collaborators: true,
        },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const hasEditPermission =
        workspace.userId === userId ||
        workspace.collaborators.some(
          c => c.userId === userId && (c.role === 'owner' || c.role === 'editor')
        );

      if (!hasEditPermission) {
        throw new Error('No permission to edit this workspace');
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          name: data.name,
          content: data.content,
          thumbnail: data.thumbnail,
          isPublic: data.isPublic,
        },
        include: {
          user: true,
          collaborators: {
            include: { user: true },
          },
        },
      });

      return {
        data: this.transformPrismaWorkspace(updatedWorkspace),
        message: 'Workspace updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(workspaceId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      if (workspace.userId !== userId) {
        throw new Error('Only the owner can delete this workspace');
      }

      await prisma.workspace.delete({
        where: { id: workspaceId },
      });

      return {
        data: undefined,
        message: 'Workspace deleted successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  /**
   * Add a collaborator to a workspace
   */
  static async addCollaborator(
    workspaceId: string,
    collaboratorUserId: string,
    role: 'editor' | 'viewer',
    requestingUserId: string
  ): Promise<ApiResponse<WorkspaceCollaborator>> {
    try {
      // Check if requesting user is the owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      if (workspace.userId !== requestingUserId) {
        throw new Error('Only the owner can add collaborators');
      }

      const collaborator = await prisma.workspaceCollaborator.create({
        data: {
          workspaceId,
          userId: collaboratorUserId,
          role,
        },
        include: {
          user: true,
        },
      });

      return {
        data: this.transformPrismaCollaborator(collaborator),
        message: 'Collaborator added successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma workspace to application type
   */
  private static transformPrismaWorkspace(prismaWorkspace: any): Workspace {
    return {
      id: prismaWorkspace.id,
      name: prismaWorkspace.name,
      userId: prismaWorkspace.userId,
      content: prismaWorkspace.content,
      thumbnail: prismaWorkspace.thumbnail || undefined,
      isPublic: prismaWorkspace.isPublic,
      createdAt: prismaWorkspace.createdAt.toISOString(),
      updatedAt: prismaWorkspace.updatedAt.toISOString(),
    };
  }

  /**
   * Transform Prisma collaborator to application type
   */
  private static transformPrismaCollaborator(prismaCollaborator: any): WorkspaceCollaborator {
    return {
      id: prismaCollaborator.id,
      workspaceId: prismaCollaborator.workspaceId,
      userId: prismaCollaborator.userId,
      role: prismaCollaborator.role,
      createdAt: prismaCollaborator.createdAt.toISOString(),
    };
  }
}
