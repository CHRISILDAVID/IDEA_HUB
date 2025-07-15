import { supabase, handleSupabaseError } from '../../lib/supabase';
import { ApiResponse } from '../../types';

export class StatsService {
  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<ApiResponse<Array<{
    name: string;
    count: number;
    trending: boolean;
  }>>> {
    try {
      // Get idea counts by category
      const { data: categoryData, error } = await supabase
        .from('ideas')
        .select('category')
        .eq('visibility', 'public' as any)
        .eq('status', 'published' as any);

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
        .eq('visibility', 'public' as any)
        .eq('status', 'published' as any)
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
  }

  /**
   * Get popular/trending statistics
   */
  static async getPopularStats(): Promise<ApiResponse<{
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
        .eq('visibility', 'public' as any)
        .eq('status', 'published' as any)
        .gte('created_at', oneWeekAgo.toISOString());

      if (newIdeasError) throw newIdeasError;

      // Get forks this week (ideas created as forks)
      const { count: forksThisWeek, error: forksError } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('is_fork', true as any)
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
        message: 'Popular stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get user dashboard statistics
   */
  static async getUserDashboardStats(userId: string): Promise<ApiResponse<{
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
        .eq('author_id', userId as any);

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
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<ApiResponse<{
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
        .eq('visibility', 'public' as any)
        .eq('status', 'published' as any);

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
        .eq('visibility', 'public' as any)
        .eq('status', 'published' as any)
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
        .eq('visibility', 'public' as any)
        .eq('status', 'published' as any);

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
  }
}
