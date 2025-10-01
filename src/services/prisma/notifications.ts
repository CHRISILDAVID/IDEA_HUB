import { prisma } from '../../lib/prisma/client';
import { Notification, ApiResponse } from '../../types';

export class PrismaNotificationsService {
  /**
   * Get notifications for a user
   */
  static async getNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        include: {
          relatedUser: true,
          relatedIdea: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        data: notifications.map(n => this.transformNotification(n)),
        message: 'Notifications retrieved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
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
   * Create a notification
   */
  static async createNotification(
    userId: string,
    type: string,
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
        data: this.transformNotification(notification),
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
   * Transform Prisma notification to app Notification type
   */
  private static transformNotification(notification: any): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      relatedUserId: notification.relatedUserId,
      relatedIdeaId: notification.relatedIdeaId,
      relatedUrl: notification.relatedUrl,
      createdAt: notification.createdAt.toISOString(),
      relatedUser: notification.relatedUser ? {
        id: notification.relatedUser.id,
        username: notification.relatedUser.username,
        email: notification.relatedUser.email,
        fullName: notification.relatedUser.fullName,
        avatar: notification.relatedUser.avatarUrl,
      } : undefined,
    };
  }
}
