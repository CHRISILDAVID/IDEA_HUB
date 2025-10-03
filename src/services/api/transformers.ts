import { User, Idea } from '../../types';

/**
 * Transform Prisma/API user object to application user object
 * Handles both camelCase (from API) and snake_case (legacy) formats
 */
export const transformApiUser = (apiUser: any): User => {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    fullName: apiUser.fullName || apiUser.full_name,
    avatar: apiUser.avatarUrl || apiUser.avatar_url,
    bio: apiUser.bio,
    location: apiUser.location,
    website: apiUser.website,
    joinedAt: apiUser.joinedAt || apiUser.joined_at,
    followers: apiUser.followers || 0,
    following: apiUser.following || 0,
    publicRepos: apiUser.publicRepos || apiUser.public_repos || 0,
    isVerified: apiUser.isVerified || apiUser.is_verified || false,
  };
};

/**
 * Transform Prisma/API idea object to application idea object
 * Handles both camelCase (from API) and snake_case (legacy) formats
 */
export const transformApiIdea = (apiIdea: any): Idea => {
  return {
    id: apiIdea.id,
    title: apiIdea.title,
    description: apiIdea.description,
    content: apiIdea.content,
    canvasData: apiIdea.canvasData || apiIdea.canvas_data,
    author: transformApiUser(apiIdea.author),
    tags: apiIdea.tags || [],
    category: apiIdea.category,
    license: apiIdea.license,
    version: apiIdea.version || '1.0.0',
    stars: apiIdea.stars || 0,
    forks: apiIdea.forks || 0,
    isStarred: apiIdea.isStarred || apiIdea.is_starred || false,
    isFork: apiIdea.isFork || apiIdea.is_fork || false,
    forkedFrom: apiIdea.forkedFrom || apiIdea.forked_from || null,
    visibility: (apiIdea.visibility?.toLowerCase() || 'public') as 'public' | 'private',
    createdAt: apiIdea.createdAt || apiIdea.created_at,
    updatedAt: apiIdea.updatedAt || apiIdea.updated_at,
    collaborators: apiIdea.collaborators || [],
    comments: apiIdea.comments || [],
    issues: [],
    language: apiIdea.language || null,
    status: (apiIdea.status?.toLowerCase() || 'published') as 'draft' | 'published' | 'archived',
  };
};

/**
 * Transform Prisma/API workspace object to application workspace object
 */
export const transformApiWorkspace = (apiWorkspace: any): any => {
  return {
    id: apiWorkspace.id,
    name: apiWorkspace.name,
    ideaId: apiWorkspace.ideaId || apiWorkspace.idea_id,
    userId: apiWorkspace.userId || apiWorkspace.user_id,
    content: apiWorkspace.content,
    isPublic: apiWorkspace.isPublic || apiWorkspace.is_public,
    createdAt: apiWorkspace.createdAt || apiWorkspace.created_at,
    updatedAt: apiWorkspace.updatedAt || apiWorkspace.updated_at,
  };
};

/**
 * Create a basic idea object from minimal data (for activity feed)
 */
export const createBasicIdea = (data: {
  id: string;
  title: string;
  author: any;
  created_at?: string;
  createdAt?: string;
}): Idea => ({
  id: data.id,
  title: data.title,
  description: '',
  content: '',
  author: transformApiUser(data.author),
  tags: [],
  category: '',
  license: '',
  version: '1.0.0',
  stars: 0,
  forks: 0,
  isStarred: false,
  isFork: false,
  forkedFrom: null,
  visibility: 'public' as 'public' | 'private',
  createdAt: data.created_at || data.createdAt || new Date().toISOString(),
  updatedAt: data.created_at || data.createdAt || new Date().toISOString(),
  collaborators: [],
  comments: [],
  issues: [],
  language: null,
  status: 'published' as 'draft' | 'published' | 'archived',
});
