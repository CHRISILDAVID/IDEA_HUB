import apiClient from '../../lib/api-client';
import { ApiResponse } from '../../types';
import { AuthService } from './auth';

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  content: {
    elements: any[];
    appState: any;
  };
  thumbnail?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  collaborators?: WorkspaceCollaborator[];
}

export interface WorkspaceCollaborator {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
}

export class WorkspacesService {
  /**
   * Get a workspace by ID
   */
  static async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.get('workspaces-get', { id });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch workspace');
      }

      return {
        data: response.data,
        message: 'Workspace retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw error;
    }
  }

  /**
   * Update a workspace
   */
  static async updateWorkspace(id: string, updates: {
    content?: any;
    thumbnail?: string;
    name?: string;
  }): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.put('workspaces-update', {
        workspaceId: id,
        ...updates,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update workspace');
      }

      return {
        data: response.data,
        message: response.message || 'Workspace updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  /**
   * Get user's workspaces
   */
  static async getUserWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      return {
        data: [],
        message: 'User workspaces not yet implemented in migration',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching user workspaces:', error);
      throw error;
    }
  }

  /**
   * Create a new workspace
   */
  static async createWorkspace(workspaceData: {
    name: string;
    content: any;
    isPublic?: boolean;
  }): Promise<ApiResponse<Workspace>> {
    try {
      throw new Error('Create workspace not implemented - use createIdea which creates workspace automatically');
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(id: string): Promise<ApiResponse<void>> {
    try {
      throw new Error('Delete workspace not implemented - delete the associated idea instead');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  /**
   * Get workspaces shared with user (as collaborator)
   */
  static async getSharedWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      return {
        data: [],
        message: 'Shared workspaces not yet implemented in migration',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching shared workspaces:', error);
      throw error;
    }
  }
}
