// Import and re-export all API services and utilities
import { AuthService } from './auth';
import { IdeasService } from './ideas';
import { UsersService } from './users';
import { NotificationsService } from './notifications';
import { ActivitiesService } from './activities';
import { StatsService } from './stats';

// Re-export all services
export { AuthService, IdeasService, UsersService, NotificationsService, ActivitiesService, StatsService };

// Re-export transformers and types
export {
  transformDbUser,
  transformDbIdea,
  createBasicIdea,
  type DbUser,
  type DbIdea,
  type DbComment,
} from './transformers';

// Re-export utilities
export {
  castToColumn,
  castToInsert,
  castToUpdate,
  castFromSupabase,
} from './utils';

// Main API object for backward compatibility
export const supabaseApi = {
  // Authentication
  signUp: AuthService.signUp,
  signIn: AuthService.signIn,
  signOut: AuthService.signOut,
  getCurrentUser: AuthService.getCurrentUser,

  // Ideas
  getIdeas: IdeasService.getIdeas,
  getIdea: IdeasService.getIdea,
  createIdea: IdeasService.createIdea,
  updateIdea: IdeasService.updateIdea,
  deleteIdea: IdeasService.deleteIdea,
  starIdea: IdeasService.starIdea,
  forkIdea: IdeasService.forkIdea,
  getPopularIdeas: IdeasService.getPopularIdeas,
  getStarredIdeas: IdeasService.getStarredIdeas,
  getForkedIdeas: IdeasService.getForkedIdeas,
  getUserIdeas: IdeasService.getUserIdeas,

  // Users
  getFollowingUsers: UsersService.getFollowingUsers,
  toggleFollow: UsersService.toggleFollow,
  getUser: UsersService.getUser,
  updateProfile: UsersService.updateProfile,
  searchUsers: UsersService.searchUsers,
  isFollowing: UsersService.isFollowing,

  // Notifications
  getNotifications: NotificationsService.getNotifications,
  markNotificationAsRead: NotificationsService.markNotificationAsRead,
  markAllNotificationsAsRead: NotificationsService.markAllNotificationsAsRead,
  deleteNotification: NotificationsService.deleteNotification,
  getUnreadCount: NotificationsService.getUnreadCount,

  // Activities
  getActivityFeed: ActivitiesService.getActivityFeed,
  getUserActivityFeed: ActivitiesService.getUserActivityFeed,

  // Stats
  getCategoryStats: StatsService.getCategoryStats,
  getPopularStats: StatsService.getPopularStats,
  getUserDashboardStats: StatsService.getUserDashboardStats,
  getPlatformStats: StatsService.getPlatformStats,
};
