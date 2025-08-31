/*
  # Create stars table

  1. New Tables
    - `stars`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `idea_id` (uuid, foreign key to ideas)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `stars` table
    - Add policy for users to manage their own stars
    - Add policy for reading stars

  3. Constraints
    - Unique constraint on user_id + idea_id to prevent duplicate stars
*/

CREATE TABLE IF NOT EXISTS stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

ALTER TABLE stars ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read stars
CREATE POLICY "Authenticated users can read stars"
  ON stars
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create their own stars
CREATE POLICY "Users can create own stars"
  ON stars
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own stars
CREATE POLICY "Users can delete own stars"
  ON stars
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to increment stars count on ideas table
CREATE OR REPLACE FUNCTION increment_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas 
  SET stars = stars + 1 
  WHERE id = NEW.idea_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement stars count on ideas table
CREATE OR REPLACE FUNCTION decrement_stars_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ideas 
  SET stars = stars - 1 
  WHERE id = OLD.idea_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update stars count
CREATE TRIGGER increment_stars_trigger
  AFTER INSERT ON stars
  FOR EACH ROW
  EXECUTE FUNCTION increment_stars_count();

CREATE TRIGGER decrement_stars_trigger
  AFTER DELETE ON stars
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stars_count();