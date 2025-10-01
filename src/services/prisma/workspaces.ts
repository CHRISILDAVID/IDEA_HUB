import { prisma } from '../../lib/prisma/client';
import { ApiResponse } from '../../types';

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  content: any;
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceCollaborator {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export class PrismaWorkspacesService {
  /**
   * Get all workspaces for a user
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
        include: {
          user: true,
          collaborators: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      return {
        data: workspaces.map(w => this.transformWorkspace(w)),
        message: 'Workspaces retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting workspaces:', error);
      throw error;
    }
  }

  /**
   * Get a single workspace by ID
   */
  static async getWorkspace(workspaceId: string, userId: string): Promise<ApiResponse<Workspace>> {
    try {
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          OR: [
            { userId },
            { isPublic: true },
            {
              collaborators: {
                some: { userId },
              },
            },
          ],
        },
        include: {
          user: true,
          collaborators: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!workspace) throw new Error('Workspace not found or access denied');

      return {
        data: this.transformWorkspace(workspace),
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
    name: string,
    userId: string,
    content?: any,
    isPublic?: boolean
  ): Promise<ApiResponse<Workspace>> {
    try {
      const workspace = await prisma.workspace.create({
        data: {
          name,
          userId,
          content: content || {},
          isPublic: isPublic || false,
          collaborators: {
            create: {
              userId,
              role: 'owner',
            },
          },
        },
        include: {
          user: true,
          collaborators: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        data: this.transformWorkspace(workspace),
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
    updates: Partial<Workspace>
  ): Promise<ApiResponse<Workspace>> {
    try {
      // Verify user has permission to update
      const existing = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          OR: [
            { userId },
            {
              collaborators: {
                some: {
                  userId,
                  role: { in: ['owner', 'editor'] },
                },
              },
            },
          ],
        },
      });

      if (!existing) throw new Error('Workspace not found or access denied');

      const workspace = await prisma.workspace.update({
        where: { id: workspaceId },
        data: {
          name: updates.name,
          content: updates.content,
          thumbnail: updates.thumbnail,
          isPublic: updates.isPublic,
        },
        include: {
          user: true,
          collaborators: {
            include: {
              user: true,
            },
          },
        },
      });

      return {
        data: this.transformWorkspace(workspace),
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
      // Verify user is the owner
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId,
        },
      });

      if (!workspace) throw new Error('Workspace not found or you are not the owner');

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
    ownerId: string,
    collaboratorEmail: string,
    role: string = 'viewer'
  ): Promise<ApiResponse<void>> {
    try {
      // Verify owner has permission
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId: ownerId,
        },
      });

      if (!workspace) throw new Error('Workspace not found or you are not the owner');

      // Find collaborator by email
      const collaborator = await prisma.user.findUnique({
        where: { email: collaboratorEmail },
      });

      if (!collaborator) throw new Error('User not found');

      // Add collaborator
      await prisma.workspaceCollaborator.create({
        data: {
          workspaceId,
          userId: collaborator.id,
          role,
        },
      });

      return {
        data: undefined,
        message: 'Collaborator added successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw error;
    }
  }

  /**
   * Remove a collaborator from a workspace
   */
  static async removeCollaborator(
    workspaceId: string,
    ownerId: string,
    collaboratorId: string
  ): Promise<ApiResponse<void>> {
    try {
      // Verify owner has permission
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          userId: ownerId,
        },
      });

      if (!workspace) throw new Error('Workspace not found or you are not the owner');

      await prisma.workspaceCollaborator.deleteMany({
        where: {
          workspaceId,
          userId: collaboratorId,
        },
      });

      return {
        data: undefined,
        message: 'Collaborator removed successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error removing collaborator:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma workspace to app Workspace type
   */
  private static transformWorkspace(workspace: any): Workspace {
    return {
      id: workspace.id,
      name: workspace.name,
      userId: workspace.userId,
      content: workspace.content,
      thumbnail: workspace.thumbnail,
      isPublic: workspace.isPublic,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }
}
