// Core types for the IdeaHub platform
export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  followers: number;
  following: number;
  publicRepos: number;
  isVerified: boolean;
}

export interface Idea {
  id: string;
  title: string;
  description: string;
  content: string;
  author: User;
  tags: string[];
  category: string;
  license: string;
  version: string;
  stars: number;
  forks: number;
  isStarred: boolean;
  isFork: boolean;
  forkedFrom?: string;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  collaborators: User[];
  comments: Comment[];
  issues: Issue[];
  language?: string;
  status: 'draft' | 'published' | 'archived';
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
  votes: number;
  isVoted: boolean;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  author: User;
  assignee?: User;
  labels: string[];
  status: 'open' | 'closed' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export interface Notification {
  id: string;
  type: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue';
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedUser?: User;
  relatedIdea?: Idea;
  relatedUrl?: string;
}

export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'starred' | 'forked' | 'commented';
  user: User;
  idea?: Idea;
  description: string;
  timestamp: string;
}

export interface SearchFilters {
  query: string;
  category: string;
  tags: string[];
  language: string;
  sort: 'newest' | 'oldest' | 'most-stars' | 'most-forks' | 'recently-updated';
  license: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}