import { prisma } from '../../lib/prisma/client';
import { ApiResponse } from '../../types';

export interface PlatformStats {
  totalIdeas: number;
  activeUsers: number;
  ideasThisWeek: number;
  totalCollaborations: number;
}

export interface CategoryStats {
  name: string;
  count: number;
  trending: boolean;
}

export class PrismaStatsService {
  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<ApiResponse<PlatformStats>> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [totalIdeas, activeUsers, ideasThisWeek, totalCollaborations] = await Promise.all([
        prisma.idea.count({
          where: {
            visibility: 'public',
            status: 'published',
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: oneWeekAgo,
            },
          },
        }),
        prisma.idea.count({
          where: {
            createdAt: {
              gte: oneWeekAgo,
            },
            visibility: 'public',
            status: 'published',
          },
        }),
        prisma.ideaCollaborator.count(),
      ]);

      return {
        data: {
          totalIdeas,
          activeUsers,
          ideasThisWeek,
          totalCollaborations,
        },
        message: 'Platform stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<ApiResponse<CategoryStats[]>> {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Get all ideas grouped by category
      const categoryGroups = await prisma.idea.groupBy({
        by: ['category'],
        where: {
          visibility: 'public',
          status: 'published',
        },
        _count: {
          category: true,
        },
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
      });

      // Get trending categories (created in the last week)
      const trendingCategories = await prisma.idea.groupBy({
        by: ['category'],
        where: {
          visibility: 'public',
          status: 'published',
          createdAt: {
            gte: oneWeekAgo,
          },
        },
        _count: {
          category: true,
        },
        having: {
          category: {
            _count: {
              gte: 3, // At least 3 ideas to be trending
            },
          },
        },
      });

      const trendingSet = new Set(trendingCategories.map(c => c.category));

      const stats: CategoryStats[] = categoryGroups.map(group => ({
        name: group.category,
        count: group._count.category,
        trending: trendingSet.has(group.category),
      }));

      return {
        data: stats,
        message: 'Category stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting category stats:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string): Promise<ApiResponse<{
    ideasCount: number;
    starsReceived: number;
    forksReceived: number;
    collaborationsCount: number;
  }>> {
    try {
      const [ideas, starsReceived, forksReceived, collaborationsCount] = await Promise.all([
        prisma.idea.count({
          where: { authorId: userId },
        }),
        prisma.star.count({
          where: {
            idea: {
              authorId: userId,
            },
          },
        }),
        prisma.idea.count({
          where: {
            forkedFrom: {
              authorId: userId,
            },
          },
        }),
        prisma.ideaCollaborator.count({
          where: { userId },
        }),
      ]);

      return {
        data: {
          ideasCount: ideas,
          starsReceived,
          forksReceived,
          collaborationsCount,
        },
        message: 'User stats retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}
