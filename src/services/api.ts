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
  async getPopularIdeas(): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getPopularIdeas();
  },

  // Get user's ideas
  async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getIdeas({ author: userId });
  },

  // Get user's starred ideas
  async getStarredIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getStarredIdeas(userId);
  },

  // Get user's forked ideas
  async getForkedIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    return supabaseApi.getForkedIdeas(userId);
  },

  // Get users that the current user is following
  async getFollowingUsers(userId: string): Promise<ApiResponse<User[]>> {
    return supabaseApi.getFollowingUsers(userId);
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return supabaseApi.markNotificationAsRead(notificationId);
  },

  // Get notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return supabaseApi.getNotifications();
  },

  // Get activity feed
  async getActivityFeed(): Promise<ApiResponse<Activity[]>> {
    return supabaseApi.getActivityFeed();
  },

  // Get platform statistics
  async getPlatformStats(): Promise<ApiResponse<{
    totalIdeas: number;
    activeUsers: number;
    ideasThisWeek: number;
    totalCollaborations: number;
  }>> {
    return supabaseApi.getPlatformStats();
  },

  // Get category statistics
  async getCategoryStats(): Promise<ApiResponse<Array<{
    name: string;
    count: number;
    trending: boolean;
  }>>> {
    return supabaseApi.getCategoryStats();
  },

  // Get trending statistics
  async getPopularStats(): Promise<ApiResponse<{
    totalViews: number;
    starsThisWeek: number;
    forksThisWeek: number;
    newIdeas: number;
  }>> {
    return supabaseApi.getPopularStats();
  },

  // Get user dashboard statistics
  async getUserDashboardStats(userId: string): Promise<ApiResponse<{
    totalIdeas: number;
    totalStars: number;
    totalForks: number;
    totalViews: number;
    recentActivity: any[];
  }>> {
    return supabaseApi.getUserDashboardStats(userId);
  },
};