import { supabaseApi } from './supabaseApi';
import { User, Idea, Comment, Issue, Notification, Activity, SearchFilters, ApiResponse } from '../types';

// Wrapper API that uses Supabase for real data
// This maintains the same interface as the mock API for easy migration

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    await supabaseApi.signIn(email, password);
    const user = await supabaseApi.getCurrentUser();
    if (!user) throw new Error('Login failed');
    
    return {
      data: user,
      message: 'Login successful',
      success: true,
    };
  },

  async register(userData: any): Promise<ApiResponse<User>> {
    await supabaseApi.signUp(userData.email, userData.password, {
      username: userData.username,
      fullName: userData.fullName,
    });
    
    const user = await supabaseApi.getCurrentUser();
    if (!user) throw new Error('Registration failed');
    
    return {
      data: user,
      message: 'Registration successful',
      success: true,
    };
  },

  // Ideas
  async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getIdeas(filters);
  },

  async getIdea(id: string): Promise<ApiResponse<Idea>> {
    return supabaseApi.getIdea(id);
  },

  async createIdea(ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    return supabaseApi.createIdea(ideaData);
  },

  async updateIdea(id: string, ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    return supabaseApi.updateIdea(id, ideaData);
  },

  async deleteIdea(id: string): Promise<ApiResponse<void>> {
    return supabaseApi.deleteIdea(id);
  },

  async starIdea(id: string): Promise<ApiResponse<void>> {
    return supabaseApi.starIdea(id);
  },

  async forkIdea(id: string): Promise<ApiResponse<Idea>> {
    return supabaseApi.forkIdea(id);
  },

  // Comments
  async addComment(ideaId: string, content: string): Promise<ApiResponse<Comment>> {
    // TODO: Implement comment functionality in supabaseApi
    const comment: Comment = {
      id: Date.now().toString(),
      content,
      author: {
        id: '1',
        username: 'current_user',
        email: 'user@example.com',
        fullName: 'Current User',
        joinedAt: new Date().toISOString(),
        followers: 0,
        following: 0,
        publicRepos: 0,
        isVerified: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
      votes: 0,
      isVoted: false,
    };

    return {
      data: comment,
      message: 'Comment added successfully',
      success: true,
    };
  },

  // Search
  async searchIdeas(query: string): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getIdeas({ query });
  },

  // Get trending ideas
  async getTrendingIdeas(): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getTrendingIdeas();
  },

  // Get user's ideas
  async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    // TODO: Implement getUserIdeas in supabaseApi
    return supabaseApi.getIdeas();
  },

  // Get notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return supabaseApi.getNotifications();
  },

  // Get activity feed
  async getActivityFeed(): Promise<ApiResponse<Activity[]>> {
    return supabaseApi.getActivityFeed();
  },
};