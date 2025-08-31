import { supabase, handleSupabaseError } from '../../lib/supabase';
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
   * Get user's workspaces
   */
  static async getUserWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      const userId = await AuthService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          collaborators:workspace_collaborators(
            *,
            user:users(id, username, full_name, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const workspaces: Workspace[] = data?.map((item: any) => ({
        id: item.id,
        name: item.name,
        userId: item.user_id,
        content: item.content || { elements: [], appState: {} },
        thumbnail: item.thumbnail,
        isPublic: item.is_public,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        collaborators: item.collaborators?.map((collab: any) => ({
          id: collab.id,
          workspaceId: collab.workspace_id,
          userId: collab.user_id,
          role: collab.role,
          user: {
            id: collab.user.id,
            username: collab.user.username,
            fullName: collab.user.full_name,
            avatar: collab.user.avatar_url,
          },
          createdAt: collab.created_at,
        })) || [],
      })) || [];

      return {
        data: workspaces,
        message: 'Workspaces retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get a specific workspace by ID
   */
  static async getWorkspace(id: string): Promise<ApiResponse<Workspace>> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select(`
          *,
          collaborators:workspace_collaborators(
            *,
            user:users(id, username, full_name, avatar_url)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const workspace: Workspace = {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        content: data.content || { elements: [], appState: {} },
        thumbnail: data.thumbnail,
        isPublic: data.is_public,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        collaborators: data.collaborators?.map((collab: any) => ({
          id: collab.id,
          workspaceId: collab.workspace_id,
          userId: collab.user_id,
          role: collab.role,
          user: {
            id: collab.user.id,
            username: collab.user.username,
            fullName: collab.user.full_name,
            avatar: collab.user.avatar_url,
          },
          createdAt: collab.created_at,
        })) || [],
      };

      return {
        data: workspace,
        message: 'Workspace retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
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
      const { data, error } = await supabase
        .rpc('create_workspace_with_owner', {
          workspace_name: workspaceData.name,
          workspace_content: workspaceData.content,
        });

      if (error) throw error;

      // Fetch the created workspace
      return this.getWorkspace(data);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
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
      const { data, error } = await supabase
        .from('workspaces')
        .update({
          name: updates.name,
          content: updates.content,
          thumbnail: updates.thumbnail,
          is_public: updates.isPublic,
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return this.getWorkspace(id);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: undefined,
        message: 'Workspace deleted successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Share workspace with a user
   */
  static async shareWorkspace(workspaceId: string, userEmail: string, role: 'editor' | 'viewer' = 'viewer'): Promise<ApiResponse<void>> {
    try {
      const { data, error } = await supabase
        .rpc('share_workspace', {
          workspace_id_param: workspaceId,
          user_email: userEmail,
          role_param: role,
        });

      if (error) throw error;

      return {
        data: undefined,
        message: 'Workspace shared successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get shared workspaces (workspaces where user is a collaborator)
   */
  static async getSharedWorkspaces(): Promise<ApiResponse<Workspace[]>> {
    try {
      const userId = await AuthService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workspace_collaborators')
        .select(`
          workspace:workspaces(
            *,
            collaborators:workspace_collaborators(
              *,
              user:users(id, username, full_name, avatar_url)
            )
          )
        `)
        .eq('user_id', userId)
        .neq('role', 'owner');

      if (error) throw error;

      const workspaces: Workspace[] = data?.map((item: any) => ({
        id: item.workspace.id,
        name: item.workspace.name,
        userId: item.workspace.user_id,
        content: item.workspace.content || { elements: [], appState: {} },
        thumbnail: item.workspace.thumbnail,
        isPublic: item.workspace.is_public,
        createdAt: item.workspace.created_at,
        updatedAt: item.workspace.updated_at,
        collaborators: item.workspace.collaborators?.map((collab: any) => ({
          id: collab.id,
          workspaceId: collab.workspace_id,
          userId: collab.user_id,
          role: collab.role,
          user: {
            id: collab.user.id,
            username: collab.user.username,
            fullName: collab.user.full_name,
            avatar: collab.user.avatar_url,
          },
          createdAt: collab.created_at,
        })) || [],
      })) || [];

      return {
        data: workspaces,
        message: 'Shared workspaces retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Remove collaborator from workspace
   */
  static async removeCollaborator(workspaceId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('workspace_collaborators')
        .delete()
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        data: undefined,
        message: 'Collaborator removed successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }
}