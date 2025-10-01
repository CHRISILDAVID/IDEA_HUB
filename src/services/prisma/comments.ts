import { prisma } from '../../lib/prisma/client';
import { Comment, ApiResponse } from '../../types';

export class PrismaCommentsService {
  /**
   * Get comments for an idea
   */
  static async getIdeaComments(ideaId: string): Promise<ApiResponse<Comment[]>> {
    try {
      const comments = await prisma.comment.findMany({
        where: {
          ideaId,
          parentId: null, // Only get top-level comments
        },
        include: {
          author: true,
          replies: {
            include: {
              author: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return {
        data: comments.map(c => this.transformComment(c)),
        message: 'Comments retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Create a comment
   */
  static async createComment(
    content: string,
    authorId: string,
    ideaId: string,
    parentId?: string
  ): Promise<ApiResponse<Comment>> {
    try {
      const comment = await prisma.comment.create({
        data: {
          content,
          authorId,
          ideaId,
          parentId,
        },
        include: {
          author: true,
        },
      });

      return {
        data: this.transformComment(comment),
        message: 'Comment created successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  static async updateComment(
    commentId: string,
    content: string
  ): Promise<ApiResponse<Comment>> {
    try {
      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
          author: true,
        },
      });

      return {
        data: this.transformComment(comment),
        message: 'Comment updated successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.comment.delete({
        where: { id: commentId },
      });

      return {
        data: undefined,
        message: 'Comment deleted successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Vote on a comment
   */
  static async voteComment(commentId: string, delta: number): Promise<ApiResponse<void>> {
    try {
      await prisma.comment.update({
        where: { id: commentId },
        data: {
          votes: { increment: delta },
        },
      });

      return {
        data: undefined,
        message: 'Vote recorded successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma comment to app Comment type
   */
  private static transformComment(comment: any): Comment {
    return {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      ideaId: comment.ideaId,
      parentId: comment.parentId,
      votes: comment.votes,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      author: comment.author ? {
        id: comment.author.id,
        username: comment.author.username,
        email: comment.author.email,
        fullName: comment.author.fullName,
        avatar: comment.author.avatarUrl,
      } : undefined,
      replies: comment.replies?.map((r: any) => this.transformComment(r)),
    };
  }
}
