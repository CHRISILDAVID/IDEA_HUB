/*
  # Initial Schema for IdeaHub

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - matches auth.users.id
      - `username` (text, unique)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, nullable)
      - `bio` (text, nullable)
      - `location` (text, nullable)
      - `website` (text, nullable)
      - `joined_at` (timestamp)
      - `followers` (integer, default 0)
      - `following` (integer, default 0)
      - `public_repos` (integer, default 0)
      - `is_verified` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ideas`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `content` (text)
      - `author_id` (uuid, foreign key to users)
      - `tags` (text array)
      - `category` (text)
      - `license` (text, default 'MIT')
      - `version` (text, default '1.0.0')
      - `stars` (integer, default 0)
      - `forks` (integer, default 0)
      - `is_fork` (boolean, default false)
      - `forked_from` (uuid, nullable, foreign key to ideas)
      - `visibility` (text, default 'public')
      - `language` (text, nullable)
      - `status` (text, default 'published')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `comments`
      - `id` (uuid, primary key)
      - `content` (text)
      - `author_id` (uuid, foreign key to users)
      - `idea_id` (uuid, foreign key to ideas)
      - `parent_id` (uuid, nullable, foreign key to comments)
      - `votes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `stars`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `idea_id` (uuid, foreign key to ideas)
      - `created_at` (timestamp)

    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, foreign key to users)
      - `following_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text)
      - `message` (text)
      - `is_read` (boolean, default false)
      - `related_user_id` (uuid, nullable, foreign key to users)
      - `related_idea_id` (uuid, nullable, foreign key to ideas)
      - `related_url` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  bio text,
  location text,
  website text,
  joined_at timestamptz DEFAULT now(),
  followers integer DEFAULT 0,
  following integer DEFAULT 0,
  public_repos integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE,
  tags text[] DEFAULT '{}',
  category text NOT NULL,
  license text DEFAULT 'MIT',
  version text DEFAULT '1.0.0',
  stars integer DEFAULT 0,
  forks integer DEFAULT 0,
  is_fork boolean DEFAULT false,
  forked_from uuid REFERENCES ideas(id) ON DELETE SET NULL,
  visibility text DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  language text,
  status text DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stars table
CREATE TABLE IF NOT EXISTS stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('star', 'fork', 'comment', 'mention', 'follow', 'issue')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  related_idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  related_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all public profiles"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ideas policies
CREATE POLICY "Anyone can read public ideas"
  ON ideas
  FOR SELECT
  TO authenticated
  USING (visibility = 'public' OR author_id = auth.uid());

CREATE POLICY "Users can create their own ideas"
  ON ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own ideas"
  ON ideas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own ideas"
  ON ideas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Anyone can read comments on public ideas"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = comments.idea_id 
      AND (ideas.visibility = 'public' OR ideas.author_id = auth.uid())
    )
  );

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Stars policies
CREATE POLICY "Users can read all stars"
  ON stars
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can star ideas"
  ON stars
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar ideas"
  ON stars
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can read all follows"
  ON follows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Notifications policies
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ideas_author_id ON ideas(author_id);
CREATE INDEX IF NOT EXISTS idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_stars ON ideas(stars DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_category ON ideas(category);
CREATE INDEX IF NOT EXISTS idx_ideas_tags ON ideas USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ideas_visibility_status ON ideas(visibility, status);

CREATE INDEX IF NOT EXISTS idx_comments_idea_id ON comments(idea_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_stars_user_id ON stars(user_id);
CREATE INDEX IF NOT EXISTS idx_stars_idea_id ON stars(idea_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updating timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update star count when stars are added/removed
CREATE OR REPLACE FUNCTION update_idea_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET stars = stars + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET stars = stars - 1 WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for star count updates
CREATE TRIGGER update_idea_stars_trigger
  AFTER INSERT OR DELETE ON stars
  FOR EACH ROW EXECUTE FUNCTION update_idea_stars_count();

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following = following + 1 WHERE id = NEW.follower_id;
    UPDATE users SET followers = followers + 1 WHERE id = NEW.following_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET following = following - 1 WHERE id = OLD.follower_id;
    UPDATE users SET followers = followers - 1 WHERE id = OLD.following_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for follow count updates
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_follow_counts();