-- Create idea_collaborators table for user roles and permissions
CREATE TABLE IF NOT EXISTS idea_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'collaborator')),
  granted_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

-- Enable Row Level Security
ALTER TABLE idea_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaborators policies
CREATE POLICY "Users can read collaborators for public ideas or their own ideas"
  ON idea_collaborators
  FOR SELECT
  TO authenticated
  USING (
    idea_id IN (
      SELECT id FROM ideas 
      WHERE visibility = 'public' 
      OR author_id = auth.uid()
      OR id IN (
        SELECT idea_id FROM idea_collaborators 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Owners can manage collaborators"
  ON idea_collaborators
  FOR ALL
  TO authenticated
  USING (
    idea_id IN (
      SELECT id FROM ideas WHERE author_id = auth.uid()
      UNION
      SELECT idea_id FROM idea_collaborators 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_idea_collaborators_user_id ON idea_collaborators(user_id);
CREATE INDEX idx_idea_collaborators_idea_id ON idea_collaborators(idea_id);
CREATE INDEX idx_idea_collaborators_role ON idea_collaborators(role);

-- Insert owners as collaborators for existing ideas
INSERT INTO idea_collaborators (user_id, idea_id, role, granted_by)
SELECT author_id, id, 'owner', author_id 
FROM ideas 
WHERE author_id IS NOT NULL
ON CONFLICT (user_id, idea_id) DO NOTHING;