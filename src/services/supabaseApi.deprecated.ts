// DEPRECATED: This file has been replaced by the structured API modules in ./api/
// Please use imports from './api/index' instead

// This file is kept for reference only and should not be used in new code
// The functionality has been moved to properly structured, modular services:
//
// - AuthService: ./api/auth.ts
// - IdeasService: ./api/ideas.ts
// - UsersService: ./api/users.ts
// - NotificationsService: ./api/notifications.ts
// - ActivitiesService: ./api/activities.ts
// - StatsService: ./api/stats.ts
//
// Import the new structured API like this:
// import { supabaseApi, AuthService, IdeasService } from './api/index';

console.warn('DEPRECATED: supabaseApi.ts has been replaced by structured modules in ./api/. Please update your imports.');

// Re-export the new structured API for backward compatibility
export { supabaseApi } from './api/index';
