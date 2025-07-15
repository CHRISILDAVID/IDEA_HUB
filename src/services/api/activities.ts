import { supabase, handleSupabaseError } from '../../lib/supabase';
import { Activity, ApiResponse } from '../../types';
import { transformDbUser, createBasicIdea, DbUser } from './transformers';

export class ActivitiesService {
  /**
   * Get activity feed for the platform
   */
  static async getActivityFeed(): Promise<ApiResponse<Activity[]>> {
    try {
      // Get recent stars
      const { data: recentStars, error: starsError } = await supabase
        .from('stars')
        .select(`
          created_at,
          user:users(*),
          idea:ideas(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (starsError) throw starsError;

      // Get recent ideas
      const { data: recentIdeas, error: ideasError } = await supabase
        .from('ideas')
        .select(`
          created_at,
          author:users(*),
          id,
          title
        `)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (ideasError) throw ideasError;

      // Get recent follows
      const { data: recentFollows, error: followsError } = await supabase
        .from('follows')
        .select(`
          created_at,
          follower:users!follows_follower_id_fkey(*),
          following:users!follows_following_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (followsError) throw followsError;

      // Combine and format activities
      const activities: Activity[] = [];

      // Add star activities
      recentStars?.forEach((star: any) => {
        activities.push({
          id: `star-${star.user.id}-${star.idea.id}-${star.created_at}`,
          type: 'starred',
          user: transformDbUser(star.user as DbUser),
          idea: star.idea ? createBasicIdea({
            id: star.idea.id,
            title: star.idea.title,
            author: star.user,
            created_at: star.idea.created_at,
          }) : undefined,
          description: `starred`,
          timestamp: star.created_at,
        });
      });

      // Add idea creation activities
      recentIdeas?.forEach((idea: any) => {
        activities.push({
          id: `idea-${idea.id}-${idea.created_at}`,
          type: 'created',
          user: transformDbUser(idea.author as DbUser),
          idea: createBasicIdea({
            id: idea.id,
            title: idea.title,
            author: idea.author,
            created_at: idea.created_at,
          }),
          description: `created a new idea`,
          timestamp: idea.created_at,
        });
      });

      // Add follow activities
      recentFollows?.forEach((follow: any) => {
        activities.push({
          id: `follow-${follow.follower.id}-${follow.following.id}-${follow.created_at}`,
          type: 'created',
          user: transformDbUser(follow.follower as DbUser),
          description: `started following ${follow.following.username}`,
          timestamp: follow.created_at,
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const limitedActivities = activities.slice(0, 20);

      return {
        data: limitedActivities,
        message: 'Activity feed retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get user-specific activity feed (ideas from followed users)
   */
  static async getUserActivityFeed(userId: string): Promise<ApiResponse<Activity[]>> {
    try {
      // Get users that the current user follows
      const { data: followedUsers, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId as any);

      if (followError) throw followError;

      if (!followedUsers || followedUsers.length === 0) {
        return {
          data: [],
          message: 'No activity from followed users',
          success: true,
        };
      }

      const followedUserIds = followedUsers.map(f => f.following_id);

      // Get recent ideas from followed users
      const { data: followedIdeas, error: ideasError } = await supabase
        .from('ideas')
        .select(`
          *,
          author:users(*)
        `)
        .in('author_id', followedUserIds)
        .eq('visibility', 'public')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (ideasError) throw ideasError;

      // Get recent stars from followed users
      const { data: followedStars, error: starsError } = await supabase
        .from('stars')
        .select(`
          created_at,
          user:users(*),
          idea:ideas(*)
        `)
        .in('user_id', followedUserIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (starsError) throw starsError;

      const activities: Activity[] = [];

      // Add idea creation activities
      followedIdeas?.forEach((idea: any) => {
        activities.push({
          id: `idea-${idea.id}-${idea.created_at}`,
          type: 'created',
          user: transformDbUser(idea.author as DbUser),
          idea: createBasicIdea({
            id: idea.id,
            title: idea.title,
            author: idea.author,
            created_at: idea.created_at,
          }),
          description: `created a new idea`,
          timestamp: idea.created_at,
        });
      });

      // Add star activities
      followedStars?.forEach((star: any) => {
        activities.push({
          id: `star-${star.user.id}-${star.idea.id}-${star.created_at}`,
          type: 'starred',
          user: transformDbUser(star.user as DbUser),
          idea: star.idea ? createBasicIdea({
            id: star.idea.id,
            title: star.idea.title,
            author: star.user,
            created_at: star.idea.created_at,
          }) : undefined,
          description: `starred`,
          timestamp: star.created_at,
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const limitedActivities = activities.slice(0, 20);

      return {
        data: limitedActivities,
        message: 'User activity feed retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }
}
