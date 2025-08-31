/*
  # Create idea_collaborators table

  1. New Tables
    - `idea_collaborators`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `idea_id` (uuid, foreign key to ideas)
      - `role` (text, either 'owner' or 'collaborator')
      - `granted_by` (uuid, foreign key to users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `idea_collaborators` table
    - Add policy for reading collaborators
    - Add policy for managing collaborators
*/

CREATE TABLE IF NOT EXISTS idea_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  granted_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

ALTER TABLE idea_collaborators ENABLE ROW LEVEL SECURITY;

-- Allow reading collaborators for public ideas
CREATE POLICY "Anyone can read collaborators for public ideas"
  ON idea_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_collaborators.idea_id 
      AND ideas.visibility = 'public' 
      AND ideas.status = 'published'
    )
  );

-- Allow idea owners to manage collaborators
CREATE POLICY "Idea owners can manage collaborators"
  ON idea_collaborators
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ideas 
      WHERE ideas.id = idea_collaborators.idea_id 
      AND ideas.author_id = auth.uid()
    )
  );

-- Create trigger to update updated_at column
CREATE TRIGGER update_idea_collaborators_updated_at
  BEFORE UPDATE ON idea_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();