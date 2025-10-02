// Import and re-export all API services and utilities
import { AuthService } from './auth';
import { IdeasService } from './ideas';
import { UsersService } from './users';
import { NotificationsService } from './notifications';
import { ActivitiesService } from './activities';
import { StatsService } from './stats';
import { WorkspacesService } from './workspaces';
import { CollaboratorsService } from './collaborators';

// Re-export all services
export { 
  AuthService, 
  IdeasService, 
  UsersService, 
  NotificationsService, 
  ActivitiesService, 
  StatsService, 
  WorkspacesService,
  CollaboratorsService,
};

// Re-export transformers and types
export {
  transformApiUser,
  transformApiIdea,
  transformApiWorkspace,
  createBasicIdea,
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
  getIdeaCollaborators: IdeasService.getIdeaCollaborators,
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

  // Workspaces
  getUserWorkspaces: WorkspacesService.getUserWorkspaces,
  getWorkspace: WorkspacesService.getWorkspace,
  createWorkspace: WorkspacesService.createWorkspace,
  updateWorkspace: WorkspacesService.updateWorkspace,
  deleteWorkspace: WorkspacesService.deleteWorkspace,
  shareWorkspace: WorkspacesService.shareWorkspace,
  getSharedWorkspaces: WorkspacesService.getSharedWorkspaces,
  removeCollaborator: WorkspacesService.removeCollaborator,

  // Collaborators
  addCollaborator: CollaboratorsService.addCollaborator,
  removeIdeaCollaborator: CollaboratorsService.removeCollaborator,
  getIdeaCollaboratorsList: CollaboratorsService.getCollaborators,
  updateCollaboratorRole: CollaboratorsService.updateCollaboratorRole,
};
