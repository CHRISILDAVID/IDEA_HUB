import { Idea, SearchFilters, ApiResponse } from '../../types';
import apiClient from '../../lib/api-client';

// Helper function to transform API response to Idea type
function transformApiIdea(apiIdea: any): Idea {
  return {
    id: apiIdea.id,
    title: apiIdea.title,
    description: apiIdea.description,
    content: apiIdea.content,
    canvasData: apiIdea.canvasData || apiIdea.canvas_data,
    author: {
      id: apiIdea.author.id,
      username: apiIdea.author.username,
      email: apiIdea.author.email,
      fullName: apiIdea.author.fullName || apiIdea.author.full_name,
      avatar: apiIdea.author.avatarUrl || apiIdea.author.avatar_url,
      bio: apiIdea.author.bio,
      location: apiIdea.author.location,
      website: apiIdea.author.website,
      joinedAt: apiIdea.author.joinedAt || apiIdea.author.joined_at,
      followers: apiIdea.author.followers || 0,
      following: apiIdea.author.following || 0,
      publicRepos: apiIdea.author.publicRepos || apiIdea.author.public_repos || 0,
      isVerified: apiIdea.author.isVerified || apiIdea.author.is_verified || false,
    },
    tags: apiIdea.tags || [],
    category: apiIdea.category,
    license: apiIdea.license,
    version: apiIdea.version || '1.0.0',
    stars: apiIdea.stars || 0,
    forks: apiIdea.forks || 0,
    isStarred: apiIdea.isStarred || false,
    isFork: apiIdea.isFork || apiIdea.is_fork || false,
    forkedFrom: apiIdea.forkedFrom || apiIdea.forked_from || null,
    visibility: apiIdea.visibility?.toLowerCase() as 'public' | 'private',
    createdAt: apiIdea.createdAt || apiIdea.created_at,
    updatedAt: apiIdea.updatedAt || apiIdea.updated_at,
    collaborators: apiIdea.collaborators || [],
    comments: apiIdea.comments || [],
    issues: [],
    language: apiIdea.language || null,
    status: apiIdea.status?.toLowerCase() as 'draft' | 'published' | 'archived',
  };
}

export class IdeasService {
  /**
   * Get ideas with optional filters
   */
  static async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters?.category && filters.category !== 'all') {
        params.append('category', filters.category);
      }

      if (filters?.language && filters.language !== 'all') {
        params.append('language', filters.language);
      }

      if (filters?.query) {
        params.append('search', filters.query);
      }

      // Default to showing public ideas
      params.append('visibility', 'PUBLIC');
      
      // TODO: Add sorting support in backend
      // For now, backend returns by created_at desc

      const queryString = params.toString();
      const endpoint = queryString ? `/ideas-list?${queryString}` : '/ideas-list';
      
      const response = await apiClient.get<{
        data: any[];
        success: boolean;
      }>(endpoint);

      const ideas = response.data?.map(transformApiIdea) || [];

      return {
        data: ideas,
        message: 'Ideas retrieved successfully',
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
      const response = await apiClient.get<{
        data: any;
        success: boolean;
      }>(`/ideas-get?id=${id}`);

      const idea = transformApiIdea(response.data);

      return {
        data: idea,
        message: 'Idea retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error fetching idea:', error);
      throw error;
    }
  }

  /**
   * Create a new idea
   */
  static async createIdea(ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    try {
      const response = await apiClient.post<{
        data: any;
        success: boolean;
        message: string;
      }>('/ideas-create', {
        title: ideaData.title!,
        description: ideaData.description!,
        content: ideaData.content!,
        canvasData: ideaData.canvasData,
        tags: ideaData.tags || [],
        category: ideaData.category!,
        license: ideaData.license || 'MIT',
        visibility: ideaData.visibility?.toUpperCase() || 'PUBLIC',
        language: ideaData.language,
        status: ideaData.status?.toUpperCase() || 'PUBLISHED',
      });

      const idea = transformApiIdea(response.data);

      return {
        data: idea,
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
      const response = await apiClient.put<{
        data: any;
        success: boolean;
        message: string;
      }>('/ideas-update', {
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

      const idea = transformApiIdea(response.data);

      return {
        data: idea,
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
      const response = await apiClient.delete<{
        success: boolean;
        message: string;
      }>(`/ideas-delete?id=${id}`);

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
   * Star or unstar an idea
   */
  static async starIdea(id: string): Promise<ApiResponse<void>> {
    try {
      // Determine current star status and toggle
      // For now, we'll use 'star' action - backend should check current status
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        isStarred: boolean;
      }>('/ideas-star', {
        ideaId: id,
        action: 'star' // or 'unstar' - will be handled by separate unstar method
      });

      return {
        data: undefined,
        message: response.message || 'Star status updated',
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
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        isStarred: boolean;
      }>('/ideas-star', {
        ideaId: id,
        action: 'unstar'
      });

      return {
        data: undefined,
        message: response.message || 'Idea unstarred',
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
      const response = await apiClient.post<{
        data: any;
        success: boolean;
        message: string;
      }>('/ideas-fork', {
        ideaId: id,
        newTitle,
        newDescription
      });

      const idea = transformApiIdea(response.data);

      return {
        data: idea,
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
      const { data, error } = await supabase
        .from('idea_collaborators')
        .select(`
          *,
          user:users(*)
        `)
        .eq('idea_id', ideaId);

      if (error) throw error;

      return {
        data: data || [],
        message: 'Collaborators retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get popular/trending ideas
   */
  static async getPopularIdeas(): Promise<ApiResponse<Idea[]>> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users(*),
          is_starred:stars!left(user_id)
        `)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('stars', { ascending: false })
        .limit(10);

      if (error) throw error;

      const ideas = data?.map((item: any) => {
        const isStarred = item.is_starred?.length > 0;
        return transformDbIdea({ ...item, is_starred: isStarred });
      }) || [];

      return {
        data: ideas,
        message: 'Popular ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get user's starred ideas
   */
  static async getStarredIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const { data, error } = await supabase
        .from('stars')
        .select(`
          idea:ideas(
            *,
            author:users(*)
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const ideas = data?.map((item: any) => 
        transformDbIdea({ ...item.idea, is_starred: true })
      ) || [];

      return {
        data: ideas,
        message: 'Starred ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get user's forked ideas
   */
  static async getForkedIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users(*),
          is_starred:stars!left(user_id)
        `)
        .eq('author_id', userId)
        .eq('is_fork', true);

      if (error) throw error;

      const ideas = data?.map((item: any) => {
        const isStarred = item.is_starred?.length > 0;
        return transformDbIdea({ ...item, is_starred: isStarred });
      }) || [];

      return {
        data: ideas,
        message: 'Forked ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get ideas created by a specific user
   */
  static async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users(*),
          is_starred:stars!left(user_id)
        `)
        .eq('author_id', userId)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ideas = data?.map((item: any) => {
        const isStarred = item.is_starred?.length > 0;
        return transformDbIdea({ ...item, is_starred: isStarred });
      }) || [];

      return {
        data: ideas,
        message: 'User ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }
}
