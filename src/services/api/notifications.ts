import { supabase, handleSupabaseError } from '../../lib/supabase';
import { Notification, ApiResponse } from '../../types';
import { transformDbUser, DbUser } from './transformers';
import { AuthService } from './auth';

export class NotificationsService {
  /**
   * Get notifications for the current user
   */
  static async getNotifications(): Promise<ApiResponse<Notification[]>> {
    try {
      const userId = await AuthService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          related_user:users!notifications_related_user_id_fkey(*),
          related_idea:ideas!notifications_related_idea_id_fkey(*)
        `)
        .eq('user_id', userId as any)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifications: Notification[] = data?.map((item: any) => ({
        id: item.id,
        type: item.type as 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue',
        message: item.message,
        isRead: item.is_read,
        createdAt: item.created_at,
        relatedUser: item.related_user ? transformDbUser(item.related_user as DbUser) : undefined,
        relatedIdea: item.related_idea ? {
          id: item.related_idea.id,
          title: item.related_idea.title,
          description: item.related_idea.description,
          content: item.related_idea.content,
          author: transformDbUser(item.related_idea.author as DbUser),
          tags: item.related_idea.tags,
          category: item.related_idea.category,
          license: item.related_idea.license,
          version: item.related_idea.version,
          stars: item.related_idea.stars,
          forks: item.related_idea.forks,
          isStarred: false,
          isFork: item.related_idea.is_fork,
          forkedFrom: item.related_idea.forked_from,
          visibility: item.related_idea.visibility as 'public' | 'private',
          createdAt: item.related_idea.created_at,
          updatedAt: item.related_idea.updated_at,
          collaborators: [],
          comments: [],
          issues: [],
          language: item.related_idea.language,
          status: item.related_idea.status as 'draft' | 'published' | 'archived',
        } : undefined,
        relatedUrl: item.related_url,
      })) || [];

      return {
        data: notifications,
        message: 'Notifications retrieved successfully',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('id', notificationId as any);

      if (error) throw error;

      return {
        data: undefined,
        message: 'Notification marked as read',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for the current user
   */
  static async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
    try {
      const userId = await AuthService.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true } as any)
        .eq('user_id', userId as any)
        .eq('is_read', false);

      if (error) throw error;

      return {
        data: undefined,
        message: 'All notifications marked as read',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId as any);

      if (error) throw error;

      return {
        data: undefined,
        message: 'Notification deleted',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    try {
      const userId = await AuthService.getCurrentUserId();
      if (!userId) {
        return {
          data: { count: 0 },
          message: 'User not authenticated',
          success: true,
        };
      }

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId as any)
        .eq('is_read', false);

      if (error) throw error;

      return {
        data: { count: count || 0 },
        message: 'Unread count retrieved',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Create a notification (internal use)
   */
  static async createNotification(
    userId: string,
    type: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue',
    message: string,
    relatedUserId?: string,
    relatedIdeaId?: string,
    relatedUrl?: string
  ): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          message,
          related_user_id: relatedUserId,
          related_idea_id: relatedIdeaId,
          related_url: relatedUrl,
        } as any);

      if (error) throw error;

      return {
        data: undefined,
        message: 'Notification created',
        success: true,
      };
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }
}
