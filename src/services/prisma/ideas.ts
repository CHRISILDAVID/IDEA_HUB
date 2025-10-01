import { prisma } from '../../lib/prisma/client';
import { Idea, ApiResponse, SearchFilters } from '../../types';

export class PrismaIdeasService {
  /**
   * Get all ideas with optional filters
   */
  static async getIdeas(filters?: Partial<SearchFilters>): Promise<ApiResponse<Idea[]>> {
    try {
      const where: any = {
        visibility: 'public',
        status: 'published',
      };

      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.language) {
        where.language = filters.language;
      }

      if (filters?.tags && filters.tags.length > 0) {
        where.tags = { hasSome: filters.tags };
      }

      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const ideas = await prisma.idea.findMany({
        where,
        include: {
          author: true,
          stars_: { where: { userId: filters?.userId || undefined } },
        },
        orderBy: filters?.sortBy === 'stars' 
          ? { stars: 'desc' }
          : filters?.sortBy === 'forks'
          ? { forks: 'desc' }
          : { createdAt: 'desc' },
        take: 50,
      });

      return {
        data: ideas.map(idea => this.transformIdea(idea)),
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
          lastEditedBy: true,
          stars_: userId ? { where: { userId } } : false,
          forks_: { include: { author: true } },
        },
      });

      if (!idea) throw new Error('Idea not found');

      return {
        data: this.transformIdea(idea),
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

      // Update user's public repos count
      await prisma.user.update({
        where: { id: userId },
        data: { publicRepos: { increment: 1 } },
      });

      return {
        data: this.transformIdea(idea),
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
          lastEditedById: userId,
          lastEditedAt: new Date(),
        },
        include: {
          author: true,
        },
      });

      return {
        data: this.transformIdea(idea),
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
  static async deleteIdea(id: string): Promise<ApiResponse<void>> {
    try {
      const idea = await prisma.idea.findUnique({
        where: { id },
        select: { authorId: true },
      });

      await prisma.idea.delete({
        where: { id },
      });

      // Update user's public repos count
      if (idea?.authorId) {
        await prisma.user.update({
          where: { id: idea.authorId },
          data: { publicRepos: { decrement: 1 } },
        });
      }

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
   * Star an idea
   */
  static async starIdea(ideaId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.star.create({
        data: {
          ideaId,
          userId,
        },
      });

      await prisma.idea.update({
        where: { id: ideaId },
        data: { stars: { increment: 1 } },
      });

      return {
        data: undefined,
        message: 'Idea starred successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error starring idea:', error);
      throw error;
    }
  }

  /**
   * Unstar an idea
   */
  static async unstarIdea(ideaId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.star.deleteMany({
        where: {
          ideaId,
          userId,
        },
      });

      await prisma.idea.update({
        where: { id: ideaId },
        data: { stars: { decrement: 1 } },
      });

      return {
        data: undefined,
        message: 'Idea unstarred successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error unstarring idea:', error);
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
      const originalIdea = await prisma.idea.findUnique({
        where: { id },
      });

      if (!originalIdea) throw new Error('Original idea not found');

      const forkedIdea = await prisma.idea.create({
        data: {
          title: newTitle || `Fork of ${originalIdea.title}`,
          description: newDescription || originalIdea.description,
          content: originalIdea.content,
          canvasData: originalIdea.canvasData,
          authorId: userId,
          tags: originalIdea.tags,
          category: originalIdea.category,
          license: originalIdea.license,
          language: originalIdea.language,
          isFork: true,
          forkedFromId: id,
          visibility: 'public',
          status: 'published',
        },
        include: {
          author: true,
        },
      });

      // Increment forks count on original idea
      await prisma.idea.update({
        where: { id },
        data: { forks: { increment: 1 } },
      });

      return {
        data: this.transformIdea(forkedIdea),
        message: 'Idea forked successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error forking idea:', error);
      throw error;
    }
  }

  /**
   * Get starred ideas for a user
   */
  static async getStarredIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const stars = await prisma.star.findMany({
        where: { userId },
        include: {
          idea: {
            include: {
              author: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const ideas = stars.filter(s => s.idea).map(s => this.transformIdea(s.idea!));

      return {
        data: ideas,
        message: 'Starred ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting starred ideas:', error);
      throw error;
    }
  }

  /**
   * Get user's ideas
   */
  static async getUserIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const ideas = await prisma.idea.findMany({
        where: {
          authorId: userId,
          visibility: 'public',
          status: 'published',
        },
        include: {
          author: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        data: ideas.map(idea => this.transformIdea(idea)),
        message: 'User ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting user ideas:', error);
      throw error;
    }
  }

  /**
   * Get user's forked ideas
   */
  static async getForkedIdeas(userId: string): Promise<ApiResponse<Idea[]>> {
    try {
      const ideas = await prisma.idea.findMany({
        where: {
          authorId: userId,
          isFork: true,
        },
        include: {
          author: true,
          forkedFrom: {
            include: {
              author: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        data: ideas.map(idea => this.transformIdea(idea)),
        message: 'Forked ideas retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting forked ideas:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma idea to app Idea type
   */
  private static transformIdea(idea: any): Idea {
    return {
      id: idea.id,
      title: idea.title,
      description: idea.description,
      content: idea.content,
      canvasData: idea.canvasData,
      authorId: idea.authorId,
      author: idea.author ? {
        id: idea.author.id,
        username: idea.author.username,
        email: idea.author.email,
        fullName: idea.author.fullName,
        avatar: idea.author.avatarUrl,
        bio: idea.author.bio,
        location: idea.author.location,
        website: idea.author.website,
        joinedAt: idea.author.joinedAt?.toISOString(),
        followers: idea.author.followers,
        following: idea.author.following,
        publicRepos: idea.author.publicRepos,
        isVerified: idea.author.isVerified,
      } : undefined,
      tags: idea.tags,
      category: idea.category,
      license: idea.license,
      version: idea.version,
      stars: idea.stars,
      forks: idea.forks,
      isFork: idea.isFork,
      forkedFrom: idea.forkedFromId,
      visibility: idea.visibility,
      language: idea.language,
      status: idea.status,
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
      isStarred: idea.stars_ && idea.stars_.length > 0,
    };
  }
}
