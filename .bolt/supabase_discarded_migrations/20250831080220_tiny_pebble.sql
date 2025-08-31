/*
  # Create comments table

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `content` (text)
      - `author_id` (uuid, foreign key to users)
      - `idea_id` (uuid, foreign key to ideas)
      - `parent_id` (uuid, nullable, foreign key to comments for replies)
      - `votes` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `comments` table
    - Add policy for reading comments on public ideas
    - Add policy for users to manage their own comments
*/

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  votes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow reading comments on public ideas
CREATE POLICY "Anyone can read comments on public ideas"
  ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = comments.idea_id 
      AND ideas.visibility = 'public' 
      AND ideas.status = 'published'
    )
  );

-- Allow authenticated users to read comments on their own ideas
CREATE POLICY "Users can read comments on own ideas"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = comments.idea_id 
      AND ideas.author_id = auth.uid()
    )
  );

-- Allow authenticated users to create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create trigger to update updated_at column
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();