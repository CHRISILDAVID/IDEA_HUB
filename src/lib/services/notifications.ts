import { prisma } from '../prisma';
import { ApiResponse } from '../../types';
import { Prisma } from '@prisma/client';

interface Notification {
  id: string;
  userId: string;
  type: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue';
  message: string;
  isRead: boolean;
  relatedUserId?: string;
  relatedIdeaId?: string;
  relatedUrl?: string;
  createdAt: string;
}

export class NotificationsService {
  /**
   * Get notifications for a user
   */
  static async getUserNotifications(
    userId: string,
    onlyUnread = false
  ): Promise<ApiResponse<Notification[]>> {
    try {
      const where: Prisma.NotificationWhereInput = {
        userId,
      };

      if (onlyUnread) {
        where.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          relatedUser: true,
          relatedIdea: true,
        },
      });

      const transformedNotifications = notifications.map(notification =>
        this.transformPrismaNotification(notification)
      );

      return {
        data: transformedNotifications,
        message: 'Notifications retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return {
        data: undefined,
        message: 'Notification marked as read',
        success: true,
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return {
        data: undefined,
        message: 'All notifications marked as read',
        success: true,
      };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  static async createNotification(
    userId: string,
    type: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue',
    message: string,
    relatedUserId?: string,
    relatedIdeaId?: string,
    relatedUrl?: string
  ): Promise<ApiResponse<Notification>> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          message,
          relatedUserId,
          relatedIdeaId,
          relatedUrl,
        },
        include: {
          relatedUser: true,
          relatedIdea: true,
        },
      });

      return {
        data: this.transformPrismaNotification(notification),
        message: 'Notification created successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return {
        data: undefined,
        message: 'Notification deleted successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Transform Prisma notification to application type
   */
  private static transformPrismaNotification(prismaNotification: any): Notification {
    return {
      id: prismaNotification.id,
      userId: prismaNotification.userId,
      type: prismaNotification.type,
      message: prismaNotification.message,
      isRead: prismaNotification.isRead,
      relatedUserId: prismaNotification.relatedUserId || undefined,
      relatedIdeaId: prismaNotification.relatedIdeaId || undefined,
      relatedUrl: prismaNotification.relatedUrl || undefined,
      createdAt: prismaNotification.createdAt.toISOString(),
    };
  }
}
