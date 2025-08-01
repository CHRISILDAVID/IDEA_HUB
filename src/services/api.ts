import { 
  AuthService,
  IdeasService,
  UsersService,
  NotificationsService,
  ActivitiesService,
  StatsService
} from './api/index';
import { User, Idea, Comment, Notification, Activity, SearchFilters, ApiResponse } from '../types';

// Wrapper API that uses the structured modular services
// This maintains the same interface for the frontend while using clean, modular backend services

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    await AuthService.signIn(email, password);
    const user = await AuthService.getCurrentUser();
    if (!user) throw new Error('Login failed');
    
    return {
      data: user,
      message: 'Login successful',
      success: true,
    };
  },

  async register(userData: any): Promise<ApiResponse<User>> {
    await AuthService.signUp(userData.email, userData.password, {
      username: userData.username,
      fullName: userData.fullName,
    });
    
    const user = await AuthService.getCurrentUser();
    if (!user) throw new Error('Registration failed');
    
    return {
      data: user,
      message: 'Registration successful',
      success: true,
    };
  },

  // Ideas
  async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    return IdeasService.getIdeas(filters);
  },

  async getIdea(id: string): Promise<ApiResponse<Idea>> {
    return IdeasService.getIdea(id);
  },

  async createIdea(ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    return IdeasService.createIdea(ideaData);
  },

  async updateIdea(id: string, ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    return IdeasService.updateIdea(id, ideaData);
  },

  async getIdeaCollaborators(ideaId: string): Promise<ApiResponse<any[]>> {
    return IdeasService.getIdeaCollaborators(ideaId);
  },

  async deleteIdea(id: string): Promise<ApiResponse<void>> {
    return IdeasService.deleteIdea(id);
  },

  async starIdea(id: string): Promise<ApiResponse<void>> {
    return IdeasService.starIdea(id);
  },

  async forkIdea(id: string): Promise<ApiResponse<Idea>> {
    return IdeasService.forkIdea(id);
  },

  // Comments
  async addComment(_ideaId: string, content: string): Promise<ApiResponse<Comment>> {
    // TODO: Implement comment functionality in structured modules
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
    return IdeasService.getIdeas({ query });
  },

  // Get trending ideas
  async getPopularIdeas(): Promise<ApiResponse<Idea[]>> {
    return IdeasService.getPopularIdeas();
  },

  // Get user's ideas
  async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    return IdeasService.getUserIdeas(userId);
  },

  // Get user's starred ideas
  async getStarredIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    return IdeasService.getStarredIdeas(userId);
  },

  // Get user's forked ideas
  async getForkedIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    return IdeasService.getForkedIdeas(userId);
  },

  // Get users that the current user is following
  async getFollowingUsers(userId: string): Promise<ApiResponse<User[]>> {
    return UsersService.getFollowingUsers(userId);
  },

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    return NotificationsService.markNotificationAsRead(notificationId);
  },

  // Get notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return NotificationsService.getNotifications();
  },

  // Get activity feed
  async getActivityFeed(): Promise<ApiResponse<Activity[]>> {
    return ActivitiesService.getActivityFeed();
  },

  // Get platform statistics
  async getPlatformStats(): Promise<ApiResponse<{
    totalIdeas: number;
    activeUsers: number;
    ideasThisWeek: number;
    totalCollaborations: number;
  }>> {
    return StatsService.getPlatformStats();
  },

  // Get category statistics
  async getCategoryStats(): Promise<ApiResponse<Array<{
    name: string;
    count: number;
    trending: boolean;
  }>>> {
    return StatsService.getCategoryStats();
  },

  // Get trending statistics
  async getPopularStats(): Promise<ApiResponse<{
    totalViews: number;
    starsThisWeek: number;
    forksThisWeek: number;
    newIdeas: number;
  }>> {
    return StatsService.getPopularStats();
  },

  // Get user dashboard statistics
  async getUserDashboardStats(userId: string): Promise<ApiResponse<{
    totalIdeas: number;
    totalStars: number;
    totalForks: number;
    totalViews: number;
    recentActivity: any[];
  }>> {
    return StatsService.getUserDashboardStats(userId);
  },

  // Comments
  async createComment(ideaId: string, content: string): Promise<ApiResponse<Comment>> {
    // Mock implementation for now
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
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

  async getIdeaComments(ideaId: string): Promise<ApiResponse<Comment[]>> {
    // Mock implementation - return empty array for now
    return {
      data: [],
      message: 'Comments retrieved successfully',
      success: true,
    };
  },
};