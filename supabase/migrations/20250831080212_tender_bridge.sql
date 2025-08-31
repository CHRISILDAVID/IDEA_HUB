/*
  # Create follows table

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, foreign key to users)
      - `following_id` (uuid, foreign key to users)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `follows` table
    - Add policy for users to manage their own follows
    - Add policy for reading follows

  3. Constraints
    - Unique constraint on follower_id + following_id to prevent duplicate follows
    - Check constraint to prevent self-following
*/

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read follows
CREATE POLICY "Authenticated users can read follows"
  ON follows
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to create their own follows
CREATE POLICY "Users can create own follows"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Allow users to delete their own follows
CREATE POLICY "Users can delete own follows"
  ON follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- Function to increment followers count on users table
CREATE OR REPLACE FUNCTION increment_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET followers = followers + 1 
  WHERE id = NEW.following_id;
  
  UPDATE users 
  SET following = following + 1 
  WHERE id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement followers count on users table
CREATE OR REPLACE FUNCTION decrement_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET followers = followers - 1 
  WHERE id = OLD.following_id;
  
  UPDATE users 
  SET following = following - 1 
  WHERE id = OLD.follower_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update follower/following counts
CREATE TRIGGER increment_followers_trigger
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION increment_followers_count();

CREATE TRIGGER decrement_followers_trigger
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION decrement_followers_count();