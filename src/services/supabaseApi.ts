import { supabase, handleSupabaseError } from '../lib/supabase';
import { User, Idea, Comment, Notification, Activity, SearchFilters, ApiResponse } from '../types';
import { Database } from '../types/database';

type DbUser = Database['public']['Tables']['users']['Row'];
type DbIdea = Database['public']['Tables']['ideas']['Row'];
type DbComment = Database['public']['Tables']['comments']['Row'];

// Helper functions to transform database types to application types
const transformDbUser = (dbUser: DbUser): User => ({
  id: dbUser.id,
  username: dbUser.username,
  email: dbUser.email,
  fullName: dbUser.full_name,
  avatar: dbUser.avatar_url,
  bio: dbUser.bio,
  location: dbUser.location,
  website: dbUser.website,
  joinedAt: dbUser.joined_at,
  followers: dbUser.followers,
  following: dbUser.following,
  publicRepos: dbUser.public_repos,
  isVerified: dbUser.is_verified,
});

const transformDbIdea = (dbIdea: DbIdea & { author: DbUser; is_starred?: boolean }): Idea => ({
  id: dbIdea.id,
  title: dbIdea.title,
  description: dbIdea.description,
  content: dbIdea.content,
  author: transformDbUser(dbIdea.author),
  tags: dbIdea.tags,
  category: dbIdea.category,
  license: dbIdea.license,
  version: dbIdea.version,
  stars: dbIdea.stars,
  forks: dbIdea.forks,
  isStarred: dbIdea.is_starred || false,
  isFork: dbIdea.is_fork,
  forkedFrom: dbIdea.forked_from,
  visibility: dbIdea.visibility as 'public' | 'private',
  createdAt: dbIdea.created_at,
  updatedAt: dbIdea.updated_at,
  collaborators: [], // TODO: Implement collaborators
  comments: [], // TODO: Load comments separately
  issues: [], // TODO: Implement issues
  language: dbIdea.language,
  status: dbIdea.status as 'draft' | 'published' | 'archived',
});

export const supabaseApi = {
  // Authentication
  async signUp(email: string, password: string, userData: { username: string; fullName: string }) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
          },
        },
      });

      if (authError) throw authError;

      // Only create profile if user is confirmed (email confirmation disabled)
      // or if we have a confirmed user
      if (authData.user && authData.user.email_confirmed_at) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: userData.username,
            email: email,
            full_name: userData.fullName,
          });

        if (profileError) throw profileError;
      }

      return authData;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      return transformDbUser(profile);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Ideas
  async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    try {
      let query = supabase
        .from('ideas')
        .select(`
          *,
          author:users(*),
          is_starred:stars!left(user_id)
        `)
        .eq('visibility', 'public')
        .eq('status', 'published');

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.language && filters.language !== 'all') {
        query = query.eq('language', filters.language);
      }

      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Apply sorting
      switch (filters?.sort) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'most-stars':
          query = query.order('stars', { ascending: false });
          break;
        case 'most-forks':
          query = query.order('forks', { ascending: false });
          break;
        case 'recently-updated':
          query = query.order('updated_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const ideas = data?.map((item: any) => {
        const isStarred = item.is_starred?.length > 0;
        return transformDbIdea({ ...item, is_starred: isStarred });
      }) || [];

      return {
        data: ideas,
        message: 'Ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  async getIdea(id: string): Promise<ApiResponse<Idea>> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users(*),
          is_starred:stars!left(user_id)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const isStarred = data.is_starred?.length > 0;
      const idea = transformDbIdea({ ...data, is_starred: isStarred });

      return {
        data: idea,
        message: 'Idea retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  async createIdea(ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ideas')
        .insert({
          title: ideaData.title!,
          description: ideaData.description!,
          content: ideaData.content!,
          author_id: user.id,
          tags: ideaData.tags || [],
          category: ideaData.category!,
          license: ideaData.license || 'MIT',
          visibility: ideaData.visibility || 'public',
          language: ideaData.language,
          status: ideaData.status || 'published',
        })
        .select(`
          *,
          author:users(*)
        `)
        .single();

      if (error) throw error;

      const idea = transformDbIdea(data);

      return {
        data: idea,
        message: 'Idea created successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  async updateIdea(id: string, ideaData: Partial<Idea>): Promise<ApiResponse<Idea>> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .update({
          title: ideaData.title,
          description: ideaData.description,
          content: ideaData.content,
          tags: ideaData.tags,
          category: ideaData.category,
          license: ideaData.license,
          visibility: ideaData.visibility,
          language: ideaData.language,
          status: ideaData.status,
        })
        .eq('id', id)
        .select(`
          *,
          author:users(*)
        `)
        .single();

      if (error) throw error;

      const idea = transformDbIdea(data);

      return {
        data: idea,
        message: 'Idea updated successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  async deleteIdea(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: undefined,
        message: 'Idea deleted successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  async starIdea(id: string): Promise<ApiResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already starred
      const { data: existingStar } = await supabase
        .from('stars')
        .select('id')
        .eq('user_id', user.id)
        .eq('idea_id', id)
        .single();

      if (existingStar) {
        // Unstar
        const { error } = await supabase
          .from('stars')
          .delete()
          .eq('user_id', user.id)
          .eq('idea_id', id);

        if (error) throw error;

        return {
          data: undefined,
          message: 'Idea unstarred',
          success: true,
        };
      } else {
        // Star
        const { error } = await supabase
          .from('stars')
          .insert({
            user_id: user.id,
            idea_id: id,
          });

        if (error) throw error;

        return {
          data: undefined,
          message: 'Idea starred',
          success: true,
        };
      }
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  async forkIdea(id: string): Promise<ApiResponse<Idea>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get original idea
      const { data: originalIdea, error: fetchError } = await supabase
        .from('ideas')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create fork
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          title: `${originalIdea.title} (Fork)`,
          description: originalIdea.description,
          content: originalIdea.content,
          author_id: user.id,
          tags: originalIdea.tags,
          category: originalIdea.category,
          license: originalIdea.license,
          visibility: 'public',
          language: originalIdea.language,
          is_fork: true,
          forked_from: id,
        })
        .select(`
          *,
          author:users(*)
        `)
        .single();

      if (error) throw error;

      // Update fork count
      await supabase
        .from('ideas')
        .update({ forks: originalIdea.forks + 1 })
        .eq('id', id);

      const idea = transformDbIdea(data);

      return {
        data: idea,
        message: 'Idea forked successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  // Get trending ideas
  async getTrendingIdeas(): Promise<ApiResponse<Idea[]>> {
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
        message: 'Trending ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  // Get category statistics
  async getCategoryStats(): Promise<ApiResponse<Array<{
    name: string;
    count: number;
    trending: boolean;
  }>>> {
    try {
      // Get idea counts by category
      const { data: categoryData, error } = await supabase
        .from('ideas')
        .select('category')
        .eq('visibility', 'public')
        .eq('status', 'published');

      if (error) throw error;

      // Count ideas by category
      const categoryCounts: { [key: string]: number } = {};
      categoryData?.forEach(idea => {
        categoryCounts[idea.category] = (categoryCounts[idea.category] || 0) + 1;
      });

      // Get trending categories (categories with ideas created in last week)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: trendingData, error: trendingError } = await supabase
        .from('ideas')
        .select('category')
        .eq('visibility', 'public')
        .eq('status', 'published')
        .gte('created_at', oneWeekAgo.toISOString());

      if (trendingError) throw trendingError;

      const trendingCategories = new Set(trendingData?.map(idea => idea.category) || []);

      // Format response
      const categories = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
        trending: trendingCategories.has(name),
      }));

      return {
        data: categories,
        message: 'Category stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  // Get trending statistics
  async getTrendingStats(): Promise<ApiResponse<{
    totalViews: number;
    starsThisWeek: number;
    forksThisWeek: number;
    newIdeas: number;
  }>> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get stars this week
      const { count: starsThisWeek, error: starsError } = await supabase
        .from('stars')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneWeekAgo.toISOString());

      if (starsError) throw starsError;

      // Get new ideas this week
      const { count: newIdeas, error: newIdeasError } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('status', 'published')
        .gte('created_at', oneWeekAgo.toISOString());

      if (newIdeasError) throw newIdeasError;

      // Get forks this week (ideas created as forks)
      const { count: forksThisWeek, error: forksError } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('is_fork', true)
        .gte('created_at', oneWeekAgo.toISOString());

      if (forksError) throw forksError;

      // Mock total views (would need view tracking implementation)
      const totalViews = (starsThisWeek || 0) * 150 + (newIdeas || 0) * 100;

      return {
        data: {
          totalViews,
          starsThisWeek: starsThisWeek || 0,
          forksThisWeek: forksThisWeek || 0,
          newIdeas: newIdeas || 0,
        },
        message: 'Trending stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  // Get user dashboard stats
  async getUserDashboardStats(userId: string): Promise<ApiResponse<{
    totalIdeas: number;
    totalStars: number;
    totalForks: number;
    totalViews: number;
    recentActivity: any[];
  }>> {
    try {
      // Get user's ideas
      const { data: userIdeas, error: ideasError } = await supabase
        .from('ideas')
        .select('id, stars, forks')
        .eq('author_id', userId);

      if (ideasError) throw ideasError;

      const totalIdeas = userIdeas?.length || 0;
      const totalStars = userIdeas?.reduce((sum, idea) => sum + (idea.stars || 0), 0) || 0;
      const totalForks = userIdeas?.reduce((sum, idea) => sum + (idea.forks || 0), 0) || 0;
      const totalViews = totalIdeas * 150; // Mock calculation

      // Get recent activity (simplified)
      const recentActivity: any[] = [];

      return {
        data: {
          totalIdeas,
          totalStars,
          totalForks,
          totalViews,
          recentActivity,
        },
        message: 'User dashboard stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  // Get platform statistics
  async getPlatformStats(): Promise<ApiResponse<{
    totalIdeas: number;
    activeUsers: number;
    ideasThisWeek: number;
    totalCollaborations: number;
  }>> {
    try {
      // Get total ideas count
      const { count: totalIdeas, error: ideasError } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('status', 'published');

      if (ideasError) throw ideasError;

      // Get active users count (users who have created ideas)
      const { count: activeUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Get ideas created this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { count: ideasThisWeek, error: weekError } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('status', 'published')
        .gte('created_at', oneWeekAgo.toISOString());

      if (weekError) throw weekError;

      // Get total collaborations (forks + stars)
      const { count: totalStars, error: starsError } = await supabase
        .from('stars')
        .select('*', { count: 'exact', head: true });

      if (starsError) throw starsError;

      const { data: forksData, error: forksError } = await supabase
        .from('ideas')
        .select('forks')
        .eq('visibility', 'public')
        .eq('status', 'published');

      if (forksError) throw forksError;

      const totalForks = forksData?.reduce((sum, idea) => sum + (idea.forks || 0), 0) || 0;
      const totalCollaborations = (totalStars || 0) + totalForks;

      return {
        data: {
          totalIdeas: totalIdeas || 0,
          activeUsers: activeUsers || 0,
          ideasThisWeek: ideasThisWeek || 0,
          totalCollaborations,
        },
        message: 'Platform stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  },

  // Get activity feed (mock for now)
  async getActivityFeed(): Promise<ApiResponse<Activity[]>> {
    // This would need a more complex implementation with activity tracking
    return {
      data: [],
      message: 'Activity feed retrieved successfully',
      success: true,
    };
  },

  // Get notifications (mock for now)
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    // This would need implementation based on the notifications table
    return {
      data: [],
      message: 'Notifications retrieved successfully',
      success: true,
    };
  },
};