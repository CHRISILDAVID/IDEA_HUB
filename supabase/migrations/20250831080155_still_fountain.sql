/*
  # Create ideas table

  1. New Tables
    - `ideas`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `content` (text)
      - `canvas_data` (text, nullable)
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

  2. Security
    - Enable RLS on `ideas` table
    - Add policy for reading public ideas
    - Add policy for authors to manage their own ideas
*/

CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  canvas_data text,
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Allow reading public ideas
CREATE POLICY "Anyone can read public ideas"
  ON ideas
  FOR SELECT
  USING (visibility = 'public' AND status = 'published');

-- Allow authenticated users to read their own ideas
CREATE POLICY "Users can read own ideas"
  ON ideas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

-- Allow authenticated users to create ideas
CREATE POLICY "Users can create ideas"
  ON ideas
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own ideas
CREATE POLICY "Users can update own ideas"
  ON ideas
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Allow users to delete their own ideas
CREATE POLICY "Users can delete own ideas"
  ON ideas
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create trigger to update updated_at column
CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();