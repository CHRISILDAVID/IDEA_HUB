import apiClient from '../../lib/api-client';
import { Idea, SearchFilters, ApiResponse } from '../../types';
import { AuthService } from './auth';

export class IdeasService {
  /**
   * Get ideas with optional filters
   */
  static async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    try {
      const response = await apiClient.get('ideas-list', {
        category: filters?.category,
        language: filters?.language,
        query: filters?.query,
        sort: filters?.sort || 'newest',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch ideas');
      }

      return {
        data: response.data || [],
        message: 'Ideas fetched successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching ideas:', error);
      throw error;
    }
  }

  /**
   * Get a single idea by ID
   */
  static async getIdea(id: string): Promise<ApiResponse<Idea>> {
    try {
      const response = await apiClient.get('ideas-get', { id });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch idea');
      }

      return {
        data: response.data,
        message: 'Idea retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching idea:', error);
      throw error;
    }
  }

  /**
   * Get ideas created by a specific user
   */
  static async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const response = await apiClient.get('ideas-list', {});
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user ideas');
      }

      const userIdeas = response.data?.filter((idea: Idea) => idea.authorId === userId) || [];

      return {
        data: userIdeas,
        message: 'User ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching user ideas:', error);
      throw error;
    }
  }

  /**
   * Create a new idea (with automatic workspace creation)
   */
  static async createIdea(ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    try {
      const response = await apiClient.post('ideas-create', {
        title: ideaData.title,
        description: ideaData.description,
        content: ideaData.content,
        canvasData: ideaData.canvasData,
        tags: ideaData.tags || [],
        category: ideaData.category,
        license: ideaData.license || 'MIT',
        visibility: ideaData.visibility?.toUpperCase() || 'PUBLIC',
        language: ideaData.language,
        status: ideaData.status?.toUpperCase() || 'PUBLISHED',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create idea');
      }

      return {
        data: response.data,
        message: response.message || 'Idea created successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error creating idea:', error);
      throw error;
    }
  }

  /**
   * Update an existing idea
   */
  static async updateIdea(id: string, ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    try {
      const response = await apiClient.put('ideas-update', {
        ideaId: id,
        title: ideaData.title,
        description: ideaData.description,
        content: ideaData.content,
        canvasData: ideaData.canvasData,
        tags: ideaData.tags,
        category: ideaData.category,
        license: ideaData.license,
        visibility: ideaData.visibility?.toUpperCase(),
        language: ideaData.language,
        status: ideaData.status?.toUpperCase(),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update idea');
      }

      return {
        data: response.data,
        message: response.message || 'Idea updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating idea:', error);
      throw error;
    }
  }

  /**
   * Delete an idea
   */
  static async deleteIdea(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.delete(`ideas-delete?id=${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete idea');
      }

      return {
        data: undefined,
        message: response.message || 'Idea deleted successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  }

  /**
   * Star an idea
   */
  static async starIdea(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('ideas-star', {
        ideaId: id,
        unstar: false,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to star idea');
      }

      return {
        data: undefined,
        message: 'Idea starred successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error starring idea:', error);
      throw error;
    }
  }

  /**
   * Unstar an idea
   */
  static async unstarIdea(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post('ideas-star', {
        ideaId: id,
        unstar: true,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to unstar idea');
      }

      return {
        data: undefined,
        message: 'Idea unstarred successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error unstarring idea:', error);
      throw error;
    }
  }

  /**
   * Fork an idea
   */
  static async forkIdea(id: string, newTitle?: string, newDescription?: string): Promise<ApiResponse<Idea>> {
    try {
      const response = await apiClient.post('ideas-fork', {
        ideaId: id,
        newTitle,
        newDescription,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fork idea');
      }

      return {
        data: response.data,
        message: response.message || 'Idea forked successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error forking idea:', error);
      throw error;
    }
  }

  /**
   * Get collaborators for an idea
   */
  static async getIdeaCollaborators(ideaId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await apiClient.get('collaborators-list', { ideaId });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch collaborators');
      }

      return {
        data: response.data || [],
        message: 'Collaborators retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      throw error;
    }
  }

  /**
   * Get popular/trending ideas
   */
  static async getPopularIdeas(): Promise<ApiResponse<Idea[]>> {
    return this.getIdeas({ sort: 'most-stars' });
  }

  /**
   * Get user's starred ideas
   */
  static async getStarredIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      return {
        data: [],
        message: 'Starred ideas not yet implemented in migration',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching starred ideas:', error);
      throw error;
    }
  }

  /**
   * Get user's forked ideas
   */
  static async getForkedIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      return {
        data: [],
        message: 'Forked ideas not yet implemented in migration',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching forked ideas:', error);
      throw error;
    }
  }
}
