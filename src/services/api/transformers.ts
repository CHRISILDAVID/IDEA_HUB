import { User, Idea } from '../../types';
import { Database } from '../../types/database';

export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbIdea = Database['public']['Tables']['ideas']['Row'];
export type DbComment = Database['public']['Tables']['comments']['Row'];

/**
 * Transform database user object to application user object
 */
export const transformDbUser = (dbUser: DbUser): User => ({
  id: dbUser.id,
  username: dbUser.username,
  email: dbUser.email,
  fullName: dbUser.full_name,
  avatar: dbUser.avatar_url,
  bio: dbUser.bio,
  location: dbUser.location,
  website: dbUser.website,
  joinedAt: dbUser.joined_at,
  followers: dbUser.followers,
  following: dbUser.following,
  publicRepos: dbUser.public_repos,
  isVerified: dbUser.is_verified,
});

/**
 * Transform database idea object to application idea object
 */
export const transformDbIdea = (dbIdea: DbIdea & { author: DbUser; is_starred?: boolean }): Idea => ({
  id: dbIdea.id,
  title: dbIdea.title,
  description: dbIdea.description,
  content: dbIdea.content,
  canvasData: dbIdea.canvas_data,
  author: transformDbUser(dbIdea.author),
  tags: dbIdea.tags,
  category: dbIdea.category,
  license: dbIdea.license,
  version: dbIdea.version,
  stars: dbIdea.stars,
  forks: dbIdea.forks,
  isStarred: dbIdea.is_starred || false,
  isFork: dbIdea.is_fork,
  forkedFrom: dbIdea.forked_from,
  visibility: dbIdea.visibility as 'public' | 'private',
  createdAt: dbIdea.created_at,
  updatedAt: dbIdea.updated_at,
  collaborators: [], // TODO: Implement collaborators
  comments: [], // TODO: Load comments separately
  issues: [], // TODO: Implement issues
  language: dbIdea.language,
  status: dbIdea.status as 'draft' | 'published' | 'archived',
});

/**
 * Create a basic idea object from minimal data (for activity feed)
 */
export const createBasicIdea = (data: {
  id: string;
  title: string;
  author: DbUser;
  created_at: string;
}): Idea => ({
  id: data.id,
  title: data.title,
  description: '',
  content: '',
  author: transformDbUser(data.author),
  tags: [],
  category: '',
  license: '',
  version: '',
  stars: 0,
  forks: 0,
  isStarred: false,
  isFork: false,
  forkedFrom: null,
  visibility: 'public' as 'public' | 'private',
  createdAt: data.created_at,
  updatedAt: data.created_at,
  collaborators: [],
  comments: [],
  issues: [],
  language: null,
  status: 'published' as 'draft' | 'published' | 'archived',
});
