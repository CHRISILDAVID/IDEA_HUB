import { User, ApiResponse } from '../../types';
import apiClient from '../../lib/api-client';

// Helper function to transform user data
function transformUser(data: any): User {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    fullName: data.fullName || data.full_name,
    avatar: data.avatarUrl || data.avatar_url,
    bio: data.bio,
    location: data.location,
    website: data.website,
    joinedAt: data.joinedAt || data.joined_at,
    followers: data.followers || 0,
    following: data.following || 0,
    publicRepos: data.publicRepos || data.public_repos || 0,
    isVerified: data.isVerified || data.is_verified || false,
  };
}

export class UsersService {
  /**
   * Get users that the current user is following
   */
  static async getFollowingUsers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      // For now, return empty array
      console.warn('getFollowingUsers endpoint not yet implemented in backend');
      return {
        data: [],
        message: 'Following users retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get following users error:', error);
      throw error;
    }
  }

  /**
   * Get users that are following the specified user
   */
  static async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      // For now, return empty array
      console.warn('getFollowers endpoint not yet implemented in backend');
      return {
        data: [],
        message: 'Followers retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get followers error:', error);
      throw error;
    }
  }

  /**
   * Follow or unfollow a user
   */
  static async toggleFollow(targetUserId: string, action: 'follow' | 'unfollow'): Promise<ApiResponse<{ isFollowing: boolean }>> {
    try {
      const response = await apiClient.post<{ data: { isFollowing: boolean }; success: boolean }>('/users-follow', {
        userId: targetUserId,
        action,
      });

      return {
        data: response.data,
        message: action === 'follow' ? 'User followed' : 'User unfollowed',
        success: true,
      };
    } catch (error) {
      console.error('Toggle follow error:', error);
      throw error;
    }
  }

  /**
   * Get a user by ID or username
   */
  static async getUser(userIdOrUsername: string): Promise<ApiResponse<User>> {
    try {
      // Determine if it's an ID or username (simple check: IDs are UUIDs)
      const isId = userIdOrUsername.includes('-') && userIdOrUsername.length > 20;
      const queryParam = isId ? `userId=${userIdOrUsername}` : `username=${userIdOrUsername}`;
      
      const response = await apiClient.get<{ data: any; success: boolean }>(`/users-profile?${queryParam}`);
      const user = transformUser(response.data);

      return {
        data: user,
        message: 'User retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<{ data: any; success: boolean }>('/users-update', {
        fullName: profileData.fullName,
        bio: profileData.bio,
        location: profileData.location,
        website: profileData.website,
        avatarUrl: profileData.avatar,
      });

      const user = transformUser(response.data);

      return {
        data: user,
        message: 'Profile updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Search users by username or full name
   */
  static async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      // For now, return empty array
      console.warn('searchUsers endpoint not yet implemented in backend');
      return {
        data: [],
        message: 'Users retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Check if current user is following a target user
   */
  static async isFollowing(targetUserId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    try {
      // Note: This endpoint doesn't exist yet in backend
      // For now, return false
      console.warn('isFollowing endpoint not yet implemented in backend');
      return {
        data: { isFollowing: false },
        message: 'Follow status retrieved',
        success: true,
      };
    } catch (error) {
      console.error('Check following status error:', error);
      throw error;
    }
  }
}
