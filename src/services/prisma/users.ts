import { prisma } from '../../lib/prisma/client';
import { User, ApiResponse } from '../../types';

export class PrismaUsersService {
  /**
   * Get a user by ID
   */
  static async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) throw new Error('User not found');

      return {
        data: this.transformUser(user),
        message: 'User retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get a user by username
   */
  static async getUserByUsername(username: string): Promise<ApiResponse<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) throw new Error('User not found');

      return {
        data: this.transformUser(user),
        message: 'User retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  /**
   * Search users by username or full name
   */
  static async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: query, mode: 'insensitive' } },
            { fullName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 20,
      });

      return {
        data: users.map(user => this.transformUser(user)),
        message: 'Users retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, profileData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          username: profileData.username,
          fullName: profileData.fullName,
          bio: profileData.bio,
          location: profileData.location,
          website: profileData.website,
          avatarUrl: profileData.avatar,
        },
      });

      return {
        data: this.transformUser(user),
        message: 'Profile updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Get user's followers
   */
  static async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: true },
      });

      const users = follows
        .filter(f => f.follower)
        .map(f => this.transformUser(f.follower!));

      return {
        data: users,
        message: 'Followers retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting followers:', error);
      throw error;
    }
  }

  /**
   * Get users that the given user is following
   */
  static async getFollowing(userId: string): Promise<ApiResponse<User[]>> {
    try {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: true },
      });

      const users = follows
        .filter(f => f.following)
        .map(f => this.transformUser(f.following!));

      return {
        data: users,
        message: 'Following retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting following:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  static async followUser(followerId: string, followingId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.follow.create({
        data: {
          followerId,
          followingId,
        },
      });

      // Update follower/following counts
      await Promise.all([
        prisma.user.update({
          where: { id: followerId },
          data: { following: { increment: 1 } },
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followers: { increment: 1 } },
        }),
      ]);

      return {
        data: undefined,
        message: 'User followed successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  static async unfollowUser(followerId: string, followingId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.follow.deleteMany({
        where: {
          followerId,
          followingId,
        },
      });

      // Update follower/following counts
      await Promise.all([
        prisma.user.update({
          where: { id: followerId },
          data: { following: { decrement: 1 } },
        }),
        prisma.user.update({
          where: { id: followingId },
          data: { followers: { decrement: 1 } },
        }),
      ]);

      return {
        data: undefined,
        message: 'User unfollowed successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma user to app User type
   */
  private static transformUser(user: any): User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      website: user.website,
      joinedAt: user.joinedAt.toISOString(),
      followers: user.followers,
      following: user.following,
      publicRepos: user.publicRepos,
      isVerified: user.isVerified,
    };
  }
}
