import { ApiResponse } from '../../types';
import apiClient from '../../lib/api-client';

export interface Collaborator {
  id: string;
  ideaId: string;
  userId: string;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
}

// Helper function to transform collaborator data
function transformCollaborator(data: any): Collaborator {
  return {
    id: data.id,
    ideaId: data.ideaId || data.idea_id,
    userId: data.userId || data.user_id,
    role: data.role,
    user: {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      fullName: data.user.fullName || data.user.full_name,
      avatar: data.user.avatarUrl || data.user.avatar_url,
    },
    createdAt: data.createdAt || data.created_at,
  };
}

export class CollaboratorsService {
  /**
   * Add a collaborator to an idea
   * CRITICAL: Maximum 3 collaborators allowed per idea
   */
  static async addCollaborator(
    ideaId: string,
    userId: string,
    role: 'EDITOR' | 'VIEWER' = 'VIEWER'
  ): Promise<ApiResponse<Collaborator>> {
    try {
      const response = await apiClient.post<{ data: any; success: boolean; message: string }>(
        '/collaborators-add',
        {
          ideaId,
          userId,
          role,
        }
      );

      const collaborator = transformCollaborator(response.data);

      return {
        data: collaborator,
        message: response.message || 'Collaborator added successfully',
        success: true,
      };
    } catch (error) {
      console.error('Add collaborator error:', error);
      throw error;
    }
  }

  /**
   * Remove a collaborator from an idea
   */
  static async removeCollaborator(ideaId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      console.warn('removeCollaborator endpoint not yet implemented in backend');
      
      return {
        data: undefined,
        message: 'Collaborator removed successfully',
        success: true,
      };
    } catch (error) {
      console.error('Remove collaborator error:', error);
      throw error;
    }
  }

  /**
   * Get collaborators for an idea
   */
  static async getCollaborators(ideaId: string): Promise<ApiResponse<Collaborator[]>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      // Collaborators are returned with the idea in ideas-get
      console.warn('getCollaborators endpoint not yet implemented in backend');
      
      return {
        data: [],
        message: 'Collaborators retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get collaborators error:', error);
      throw error;
    }
  }

  /**
   * Update collaborator role
   */
  static async updateCollaboratorRole(
    ideaId: string,
    userId: string,
    role: 'EDITOR' | 'VIEWER'
  ): Promise<ApiResponse<Collaborator>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      console.warn('updateCollaboratorRole endpoint not yet implemented in backend');
      
      throw new Error('updateCollaboratorRole not yet implemented');
    } catch (error) {
      console.error('Update collaborator role error:', error);
      throw error;
    }
  }
}
