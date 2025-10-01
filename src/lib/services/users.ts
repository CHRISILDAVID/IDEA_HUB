import { prisma } from '../prisma';
import { User, ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';

export class UsersService {
  /**
   * Get users that the current user is following
   */
  static async getFollowingUsers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: true,
        },
      });

      const users = follows.map(follow => this.transformPrismaUser(follow.following));

      return {
        data: users,
        message: 'Following users retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting following users:', error);
      throw error;
    }
  }

  /**
   * Get users that are following the specified user
   */
  static async getFollowers(userId: string): Promise<ApiResponse<User[]>> {
    try {
      const follows = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: true,
        },
      });

      const users = follows.map(follow => this.transformPrismaUser(follow.follower));

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
   * Get a user by ID
   */
  static async getUser(userId: string): Promise<ApiResponse<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        data: this.transformPrismaUser(user),
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

      if (!user) {
        throw new Error('User not found');
      }

      return {
        data: this.transformPrismaUser(user),
        message: 'User retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          username: userData.username,
          fullName: userData.fullName,
          avatarUrl: userData.avatar,
          bio: userData.bio,
          location: userData.location,
          website: userData.website,
        },
      });

      return {
        data: this.transformPrismaUser(user),
        message: 'User updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  static async followUser(followerId: string, followingId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            followerId,
            followingId,
          },
        }),
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
      const follow = await prisma.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });

      if (!follow) {
        throw new Error('Follow relationship not found');
      }

      await prisma.$transaction([
        prisma.follow.delete({
          where: { id: follow.id },
        }),
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
   * Check if a user is following another user
   */
  static async isFollowing(followerId: string, followingId: string): Promise<ApiResponse<boolean>> {
    try {
      const follow = await prisma.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });

      return {
        data: !!follow,
        message: 'Follow status retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error checking follow status:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma user to application User type
   */
  private static transformPrismaUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      username: prismaUser.username,
      email: prismaUser.email,
      fullName: prismaUser.fullName,
      avatar: prismaUser.avatarUrl || undefined,
      bio: prismaUser.bio || undefined,
      location: prismaUser.location || undefined,
      website: prismaUser.website || undefined,
      joinedAt: prismaUser.joinedAt.toISOString(),
      followers: prismaUser.followers,
      following: prismaUser.following,
      publicRepos: prismaUser.publicRepos,
      isVerified: prismaUser.isVerified,
      createdAt: prismaUser.createdAt.toISOString(),
      updatedAt: prismaUser.updatedAt.toISOString(),
    };
  }
}
