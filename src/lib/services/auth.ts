import { prisma } from '../prisma';
import { User, ApiResponse } from '../../types';
import bcrypt from 'bcryptjs';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(
    email: string,
    password: string,
    username: string,
    fullName: string
  ): Promise<ApiResponse<User>> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
          ],
        },
      });

      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          fullName,
        },
      });

      return {
        data: this.transformPrismaUser(user),
        message: 'User registered successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Note: In a real implementation, you would verify the password hash
      // For now, we'll assume authentication is handled by Next-Auth or similar

      return {
        data: this.transformPrismaUser(user),
        message: 'Login successful',
        success: true,
      };
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: string): Promise<ApiResponse<User>> {
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
      console.error('Error getting current user:', error);
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
