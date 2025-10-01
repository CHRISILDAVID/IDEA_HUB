import { prisma } from '../prisma';
import { ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  ideaId: string;
  parentId?: string;
  votes: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
  replies?: Comment[];
}

export class CommentsService {
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
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      const transformedComments = comments.map(comment =>
        this.transformPrismaComment(comment)
      );

      return {
        data: transformedComments,
        message: 'Comments retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  /**
   * Create a new comment
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
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return {
        data: this.transformPrismaComment(comment),
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
    content: string,
    userId: string
  ): Promise<ApiResponse<Comment>> {
    try {
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!existingComment) {
        throw new Error('Comment not found');
      }

      if (existingComment.authorId !== userId) {
        throw new Error('Unauthorized to update this comment');
      }

      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: { content },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return {
        data: this.transformPrismaComment(comment),
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
  static async deleteComment(commentId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const existingComment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!existingComment) {
        throw new Error('Comment not found');
      }

      if (existingComment.authorId !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }

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
  static async voteComment(
    commentId: string,
    increment: boolean
  ): Promise<ApiResponse<Comment>> {
    try {
      const comment = await prisma.comment.update({
        where: { id: commentId },
        data: {
          votes: {
            increment: increment ? 1 : -1,
          },
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      });

      return {
        data: this.transformPrismaComment(comment),
        message: 'Vote recorded successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error voting on comment:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma comment to application type
   */
  private static transformPrismaComment(prismaComment: any): Comment {
    return {
      id: prismaComment.id,
      content: prismaComment.content,
      authorId: prismaComment.authorId,
      ideaId: prismaComment.ideaId,
      parentId: prismaComment.parentId || undefined,
      votes: prismaComment.votes,
      createdAt: prismaComment.createdAt.toISOString(),
      updatedAt: prismaComment.updatedAt.toISOString(),
      author: prismaComment.author
        ? {
            id: prismaComment.author.id,
            username: prismaComment.author.username,
            avatar: prismaComment.author.avatarUrl || undefined,
          }
        : undefined,
      replies: prismaComment.replies
        ? prismaComment.replies.map((reply: any) => this.transformPrismaComment(reply))
        : undefined,
    };
  }
}
