import { supabase, handleSupabaseError } from '../../lib/supabase';
import { User, ApiResponse } from '../../types';
import { transformDbUser, DbUser } from './transformers';
import { castToColumn, castToInsert, castToUpdate, castFromSupabase } from './utils';

export class UsersService {
  /**
   * Get users that the current user is following
   */
  static async getFollowingUsers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:users!follows_following_id_fkey(*)
        `)
        .eq('follower_id', castToColumn(userId));

      if (error) throw error;

      const users = data?.map((item: any) => transformDbUser(item.following as DbUser)) || [];

      return {
        data: users,
        message: 'Following users retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get users that are following the specified user
   */
  static async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:users!follows_follower_id_fkey(*)
        `)
        .eq('following_id', castToColumn(userId));

      if (error) throw error;

      const users = data?.map((item: any) => transformDbUser(item.follower as DbUser)) || [];

      return {
        data: users,
        message: 'Followers retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Follow or unfollow a user
   */
  static async toggleFollow(targetUserId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', castToColumn(user.id))
        .eq('following_id', castToColumn(targetUserId))
        .single();

      if (existingFollow) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', castToColumn(user.id))
          .eq('following_id', castToColumn(targetUserId));

        if (error) throw error;

        return {
          data: { isFollowing: false },
          message: 'User unfollowed',
          success: true,
        };
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          } as any);

        if (error) throw error;

        return {
          data: { isFollowing: true },
          message: 'User followed',
          success: true,
        };
      }
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get a user by ID
   */
  static async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('User not found');

      const user = transformDbUser(data as unknown as DbUser);

      return {
        data: user,
        message: 'User retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, profileData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          username: profileData.username,
          full_name: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          avatar_url: profileData.avatar,
        } as any)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to update profile');

      const user = transformDbUser(data as unknown as DbUser);

      return {
        data: user,
        message: 'Profile updated successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Search users by username or full name
   */
  static async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      const users = data?.map((user: any) => transformDbUser(user as DbUser)) || [];

      return {
        data: users,
        message: 'Users retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Check if current user is following a target user
   */
  static async isFollowing(targetUserId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          data: { isFollowing: false },
          message: 'User not authenticated',
          success: true,
        };
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        data: { isFollowing: !!data },
        message: 'Follow status retrieved',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }
}
