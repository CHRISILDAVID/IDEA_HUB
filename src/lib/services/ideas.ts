import { prisma } from '../prisma';
import { Idea, SearchFilters, ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';

export class IdeasService {
  /**
   * Get ideas with optional filters
   */
  static async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    try {
      const where: Prisma.IdeaWhereInput = {
        visibility: 'public',
        status: 'published',
      };

      // Apply filters
      if (filters?.category && filters.category !== 'all') {
        where.category = filters.category;
      }

      if (filters?.language && filters.language !== 'all') {
        where.language = filters.language;
      }

      if (filters?.query) {
        where.OR = [
          { title: { contains: filters.query, mode: 'insensitive' } },
          { description: { contains: filters.query, mode: 'insensitive' } },
        ];
      }

      // Define ordering
      let orderBy: Prisma.IdeaOrderByWithRelationInput = { createdAt: 'desc' };
      
      switch (filters?.sort) {
        case 'oldest':
          orderBy = { createdAt: 'asc' };
          break;
        case 'most-stars':
          orderBy = { stars: 'desc' };
          break;
        case 'most-forks':
          orderBy = { forks: 'desc' };
          break;
        case 'recently-updated':
          orderBy = { updatedAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }

      const ideas = await prisma.idea.findMany({
        where,
        orderBy,
        include: {
          author: true,
          starsList: {
            select: { userId: true },
          },
        },
      });

      // Transform to match the expected Idea type
      const transformedIdeas = ideas.map(idea => this.transformPrismaIdea(idea));

      return {
        data: transformedIdeas,
        message: 'Ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting ideas:', error);
      throw error;
    }
  }

  /**
   * Get a single idea by ID
   */
  static async getIdea(id: string, userId?: string): Promise<ApiResponse<Idea>> {
    try {
      const idea = await prisma.idea.findUnique({
        where: { id },
        include: {
          author: true,
          starsList: {
            select: { userId: true },
          },
        },
      });

      if (!idea) {
        throw new Error('Idea not found');
      }

      // Check if user has starred this idea
      const isStarred = userId 
        ? idea.starsList.some(star => star.userId === userId)
        : false;

      const transformedIdea = this.transformPrismaIdea({ ...idea, isStarred });

      return {
        data: transformedIdea,
        message: 'Idea retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting idea:', error);
      throw error;
    }
  }

  /**
   * Create a new idea
   */
  static async createIdea(ideaData: Partial<Idea>, userId: string): Promise<ApiResponse<Idea>> {
    try {
      if (!userId) throw new Error('User not authenticated');

      const idea = await prisma.idea.create({
        data: {
          title: ideaData.title!,
          description: ideaData.description!,
          content: ideaData.content!,
          canvasData: ideaData.canvasData,
          authorId: userId,
          tags: ideaData.tags || [],
          category: ideaData.category!,
          license: ideaData.license || 'MIT',
          visibility: ideaData.visibility || 'public',
          language: ideaData.language,
          status: ideaData.status || 'published',
        },
        include: {
          author: true,
        },
      });

      const transformedIdea = this.transformPrismaIdea(idea);

      return {
        data: transformedIdea,
        message: 'Idea created successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error creating idea:', error);
      throw error;
    }
  }

  /**
   * Update an idea
   */
  static async updateIdea(id: string, ideaData: Partial<Idea>, userId: string): Promise<ApiResponse<Idea>> {
    try {
      // Check if user owns the idea
      const existingIdea = await prisma.idea.findUnique({
        where: { id },
      });

      if (!existingIdea) {
        throw new Error('Idea not found');
      }

      if (existingIdea.authorId !== userId) {
        throw new Error('Unauthorized to update this idea');
      }

      const idea = await prisma.idea.update({
        where: { id },
        data: {
          title: ideaData.title,
          description: ideaData.description,
          content: ideaData.content,
          canvasData: ideaData.canvasData,
          tags: ideaData.tags,
          category: ideaData.category,
          license: ideaData.license,
          visibility: ideaData.visibility,
          language: ideaData.language,
          status: ideaData.status,
          lastEditedAt: new Date(),
          lastEditedBy: userId,
        },
        include: {
          author: true,
        },
      });

      const transformedIdea = this.transformPrismaIdea(idea);

      return {
        data: transformedIdea,
        message: 'Idea updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating idea:', error);
      throw error;
    }
  }

  /**
   * Delete an idea
   */
  static async deleteIdea(id: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const existingIdea = await prisma.idea.findUnique({
        where: { id },
      });

      if (!existingIdea) {
        throw new Error('Idea not found');
      }

      if (existingIdea.authorId !== userId) {
        throw new Error('Unauthorized to delete this idea');
      }

      await prisma.idea.delete({
        where: { id },
      });

      return {
        data: undefined,
        message: 'Idea deleted successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw error;
    }
  }

  /**
   * Get ideas created by a specific user
   */
  static async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const ideas = await prisma.idea.findMany({
        where: {
          authorId: userId,
          visibility: 'public',
          status: 'published',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          starsList: {
            select: { userId: true },
          },
        },
      });

      const transformedIdeas = ideas.map(idea => this.transformPrismaIdea(idea));

      return {
        data: transformedIdeas,
        message: 'User ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting user ideas:', error);
      throw error;
    }
  }

  /**
   * Fork an idea
   */
  static async forkIdea(
    id: string,
    userId: string,
    newTitle?: string,
    newDescription?: string
  ): Promise<ApiResponse<Idea>> {
    try {
      const parentIdea = await prisma.idea.findUnique({
        where: { id },
      });

      if (!parentIdea) {
        throw new Error('Parent idea not found');
      }

      // Create the forked idea in a transaction
      const [forkedIdea] = await prisma.$transaction([
        prisma.idea.create({
          data: {
            title: newTitle || `Fork of ${parentIdea.title}`,
            description: newDescription || parentIdea.description,
            content: parentIdea.content,
            canvasData: parentIdea.canvasData,
            authorId: userId,
            tags: parentIdea.tags,
            category: parentIdea.category,
            license: parentIdea.license,
            visibility: parentIdea.visibility,
            language: parentIdea.language,
            isFork: true,
            forkedFrom: id,
          },
          include: {
            author: true,
          },
        }),
        // Increment fork count on parent idea
        prisma.idea.update({
          where: { id },
          data: { forks: { increment: 1 } },
        }),
      ]);

      const transformedIdea = this.transformPrismaIdea(forkedIdea);

      return {
        data: transformedIdea,
        message: 'Idea forked successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error forking idea:', error);
      throw error;
    }
  }

  /**
   * Star/unstar an idea
   */
  static async toggleStar(ideaId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const existingStar = await prisma.star.findFirst({
        where: {
          ideaId,
          userId,
        },
      });

      if (existingStar) {
        // Unstar
        await prisma.$transaction([
          prisma.star.delete({
            where: { id: existingStar.id },
          }),
          prisma.idea.update({
            where: { id: ideaId },
            data: { stars: { decrement: 1 } },
          }),
        ]);

        return {
          data: false,
          message: 'Idea unstarred successfully',
          success: true,
        };
      } else {
        // Star
        await prisma.$transaction([
          prisma.star.create({
            data: {
              ideaId,
              userId,
            },
          }),
          prisma.idea.update({
            where: { id: ideaId },
            data: { stars: { increment: 1 } },
          }),
        ]);

        return {
          data: true,
          message: 'Idea starred successfully',
          success: true,
        };
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma idea to application Idea type
   */
  private static transformPrismaIdea(prismaIdea: any): Idea {
    return {
      id: prismaIdea.id,
      title: prismaIdea.title,
      description: prismaIdea.description,
      content: prismaIdea.content,
      canvasData: prismaIdea.canvasData || undefined,
      author: prismaIdea.author ? {
        id: prismaIdea.author.id,
        username: prismaIdea.author.username,
        email: prismaIdea.author.email,
        fullName: prismaIdea.author.fullName,
        avatar: prismaIdea.author.avatarUrl || undefined,
        bio: prismaIdea.author.bio || undefined,
        location: prismaIdea.author.location || undefined,
        website: prismaIdea.author.website || undefined,
        joinedAt: prismaIdea.author.joinedAt.toISOString(),
        followers: prismaIdea.author.followers,
        following: prismaIdea.author.following,
        publicRepos: prismaIdea.author.publicRepos,
        isVerified: prismaIdea.author.isVerified,
        createdAt: prismaIdea.author.createdAt.toISOString(),
        updatedAt: prismaIdea.author.updatedAt.toISOString(),
      } : undefined,
      tags: prismaIdea.tags || [],
      category: prismaIdea.category,
      license: prismaIdea.license,
      version: prismaIdea.version,
      stars: prismaIdea.stars,
      forks: prismaIdea.forks,
      isFork: prismaIdea.isFork,
      forkedFrom: prismaIdea.forkedFrom || undefined,
      visibility: prismaIdea.visibility as 'public' | 'private',
      language: prismaIdea.language || undefined,
      status: prismaIdea.status as 'draft' | 'published' | 'archived',
      createdAt: prismaIdea.createdAt.toISOString(),
      updatedAt: prismaIdea.updatedAt.toISOString(),
      isStarred: prismaIdea.isStarred || false,
    };
  }
}
