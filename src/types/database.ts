export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          email: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          joined_at: string
          followers: number
          following: number
          public_repos: number
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          joined_at?: string
          followers?: number
          following?: number
          public_repos?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          joined_at?: string
          followers?: number
          following?: number
          public_repos?: number
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          title: string
          description: string
          content: string
          author_id: string
          tags: string[]
          category: string
          license: string
          version: string
          stars: number
          forks: number
          is_fork: boolean
          forked_from: string | null
          visibility: 'public' | 'private'
          language: string | null
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          content: string
          author_id: string
          tags?: string[]
          category: string
          license?: string
          version?: string
          stars?: number
          forks?: number
          is_fork?: boolean
          forked_from?: string | null
          visibility?: 'public' | 'private'
          language?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          content?: string
          author_id?: string
          tags?: string[]
          category?: string
          license?: string
          version?: string
          stars?: number
          forks?: number
          is_fork?: boolean
          forked_from?: string | null
          visibility?: 'public' | 'private'
          language?: string | null
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          content: string
          author_id: string
          idea_id: string
          parent_id: string | null
          votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          author_id: string
          idea_id: string
          parent_id?: string | null
          votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          author_id?: string
          idea_id?: string
          parent_id?: string | null
          votes?: number
          created_at?: string
          updated_at?: string
        }
      }
      stars: {
        Row: {
          id: string
          user_id: string
          idea_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          idea_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          idea_id?: string
          created_at?: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue'
          message: string
          is_read: boolean
          related_user_id: string | null
          related_idea_id: string | null
          related_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue'
          message: string
          is_read?: boolean
          related_user_id?: string | null
          related_idea_id?: string | null
          related_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'star' | 'fork' | 'comment' | 'mention' | 'follow' | 'issue'
          message?: string
          is_read?: boolean
          related_user_id?: string | null
          related_idea_id?: string | null
          related_url?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}