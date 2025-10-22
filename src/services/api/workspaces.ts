import { ApiResponse } from '../../types';
import apiClient from '../../lib/api-client';

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

// Helper function to transform workspace data
function transformWorkspace(data: any): Workspace {
  return {
    id: data.id,
    name: data.name,
    userId: data.userId || data.user_id,
    content: data.content || { elements: [], appState: {} },
    thumbnail: data.thumbnail,
    isPublic: data.isPublic || data.is_public,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    collaborators: data.collaborators?.map((collab: any) => ({
      id: collab.id,
      workspaceId: collab.workspaceId || collab.workspace_id,
      userId: collab.userId || collab.user_id,
      role: collab.role,
      user: {
        id: collab.user.id,
        username: collab.user.username,
        fullName: collab.user.fullName || collab.user.full_name,
        avatar: collab.user.avatarUrl || collab.user.avatar_url,
      },
      createdAt: collab.createdAt || collab.created_at,
    })) || [],
  };
}

export class WorkspacesService {
  /**
   * Get user's workspaces
   */
  static async getUserWorkspaces(userId?: string): Promise<ApiResponse<Workspace[]>> {
    try {
      const endpoint = userId ? `/workspaces-list?userId=${userId}` : '/workspaces-list';
      const response = await apiClient.get<{ data: any[]; success: boolean }>(endpoint);

      const workspaces = response.data.map(transformWorkspace);

      return {
        data: workspaces,
        message: 'Workspaces retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get user workspaces error:', error);
      throw error;
    }
  }

  /**
   * Get a specific workspace by ID
   */
  static async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.get<{ data: any; success: boolean }>(`/workspaces-get?id=${id}`);
      const workspace = transformWorkspace(response.data);

      return {
        data: workspace,
        message: 'Workspace retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get workspace error:', error);
      throw error;
    }
  }

  /**
   * Get workspace by idea ID
   */
  static async getWorkspaceByIdeaId(ideaId: string): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.get<{ data: any; success: boolean }>(`/workspaces-by-idea?ideaId=${ideaId}`);
      const workspace = transformWorkspace(response.data);

      return {
        data: workspace,
        message: 'Workspace retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get workspace by idea error:', error);
      throw error;
    }
  }

  /**
   * Create a new workspace
   * NOTE: Workspaces are now created automatically with ideas
   * This method exists for backwards compatibility
   */
  static async createWorkspace(workspaceData: {
    name: string;
    content: any;
    isPublic?: boolean;
  }): Promise<ApiResponse<Workspace>> {
    // Workspaces should be created via ideas-create endpoint
    // This is deprecated but kept for backwards compatibility
    console.warn('createWorkspace is deprecated. Workspaces are now created with ideas.');
    
    throw new Error('Workspaces must be created via the ideas endpoint');
  }

  /**
   * Update an existing workspace
   */
  static async updateWorkspace(id: string, updates: {
    name?: string;
    content?: any;
    thumbnail?: string;
    isPublic?: boolean;
  }): Promise<ApiResponse<Workspace>> {
    try {
      const response = await apiClient.put<{ data: any; success: boolean }>('/workspaces-update', {
        workspaceId: id,
        ...updates,
      });

      const workspace = transformWorkspace(response.data);

      return {
        data: workspace,
        message: 'Workspace updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Update workspace error:', error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   * NOTE: Workspaces are deleted automatically when ideas are deleted
   * This method exists for backwards compatibility
   */
  static async deleteWorkspace(id: string): Promise<ApiResponse<void>> {
    // Workspaces should be deleted via ideas-delete endpoint
    // This is deprecated but kept for backwards compatibility
    console.warn('deleteWorkspace is deprecated. Workspaces are deleted with ideas.');
    
    throw new Error('Workspaces must be deleted via the ideas endpoint');
  }

  /**
   * Share workspace with a user
   * NOTE: Workspaces are shared via idea collaborators
   * Use the collaborators endpoints instead
   */
  static async shareWorkspace(workspaceId: string, userEmail: string, role: 'editor' | 'viewer' = 'viewer'): Promise<ApiResponse<void>> {
    console.warn('shareWorkspace is deprecated. Use collaborators-add endpoint instead.');
    
    throw new Error('Use collaborators-add endpoint to share workspaces');
  }

  /**
   * Get shared workspaces (workspaces where user is a collaborator)
   */
  static async getSharedWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      // Get current user's workspaces which include those shared via collaboration
      return this.getUserWorkspaces();
    } catch (error) {
      console.error('Get shared workspaces error:', error);
      throw error;
    }
  }

  /**
   * Remove collaborator from workspace
   * NOTE: Use the collaborators-remove endpoint instead
   */
  static async removeCollaborator(workspaceId: string, userId: string): Promise<ApiResponse<void>> {
    console.warn('removeCollaborator is deprecated. Use collaborators-remove endpoint instead.');
    
    throw new Error('Use collaborators-remove endpoint to remove collaborators');
  }

  /**
   * Check if user can edit workspace
   */
  static canEditWorkspace(workspace: Workspace, userId: string): boolean {
    // User can edit if they are the owner
    if (workspace.userId === userId) return true;
    
    // Or if they are a collaborator with EDITOR or OWNER role
    const collaborator = workspace.collaborators?.find(c => c.userId === userId);
    return collaborator?.role === 'EDITOR' || collaborator?.role === 'owner';
  }

  /**
   * Check if user can view workspace
   */
  static canViewWorkspace(workspace: Workspace, userId: string | null): boolean {
    // Public workspaces can be viewed by anyone
    if (workspace.isPublic) return true;
    
    // Private workspaces require authentication
    if (!userId) return false;
    
    // User can view if they are the owner
    if (workspace.userId === userId) return true;
    
    // Or if they are a collaborator
    return workspace.collaborators?.some(c => c.userId === userId) || false;
  }
}