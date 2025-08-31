/*
  # Create Workspace Schema for IdeaHub

  1. New Tables
    - `workspaces`
      - `id` (uuid, primary key)
      - `name` (text)
      - `user_id` (uuid, foreign key to users)
      - `content` (jsonb) - stores the workspace canvas data
      - `thumbnail` (text) - base64 or URL for workspace preview
      - `is_public` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `workspace_collaborators`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key to workspaces)
      - `user_id` (uuid, foreign key to users)
      - `role` (text) - 'owner', 'editor', 'viewer'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for workspace access control
    - Add policies for collaboration management

  3. Functions
    - Add trigger to update updated_at timestamp
    - Add function to manage workspace sharing
*/

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Untitled Workspace',
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content jsonb DEFAULT '{"elements": [], "appState": {}}',
  thumbnail text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create workspace collaborators table
CREATE TABLE IF NOT EXISTS workspace_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_collaborators ENABLE ROW LEVEL SECURITY;

-- Workspace policies
CREATE POLICY "Users can view their own workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view public workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can view shared workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_collaborators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create workspaces"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workspaces"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Editors can update shared workspaces"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_collaborators 
      WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can delete their own workspaces"
  ON workspaces
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Workspace collaborators policies
CREATE POLICY "Users can view workspace collaborators"
  ON workspace_collaborators
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces 
      WHERE user_id = auth.uid() OR is_public = true
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Workspace owners can manage collaborators"
  ON workspace_collaborators
  FOR ALL
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Add updated_at trigger for workspaces
CREATE OR REPLACE FUNCTION update_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_updated_at();

-- Function to create workspace with owner collaboration record
CREATE OR REPLACE FUNCTION create_workspace_with_owner(
  workspace_name text,
  workspace_content jsonb DEFAULT '{"elements": [], "appState": {}}'
)
RETURNS uuid AS $$
DECLARE
  new_workspace_id uuid;
BEGIN
  -- Create the workspace
  INSERT INTO workspaces (name, user_id, content)
  VALUES (workspace_name, auth.uid(), workspace_content)
  RETURNING id INTO new_workspace_id;
  
  -- Add owner as collaborator
  INSERT INTO workspace_collaborators (workspace_id, user_id, role)
  VALUES (new_workspace_id, auth.uid(), 'owner');
  
  RETURN new_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share workspace with user
CREATE OR REPLACE FUNCTION share_workspace(
  workspace_id_param uuid,
  user_email text,
  role_param text DEFAULT 'viewer'
)
RETURNS boolean AS $$
DECLARE
  target_user_id uuid;
  workspace_owner_id uuid;
BEGIN
  -- Check if current user owns the workspace
  SELECT user_id INTO workspace_owner_id
  FROM workspaces
  WHERE id = workspace_id_param;
  
  IF workspace_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only workspace owners can share workspaces';
  END IF;
  
  -- Find target user by email
  SELECT id INTO target_user_id
  FROM users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Add or update collaboration
  INSERT INTO workspace_collaborators (workspace_id, user_id, role)
  VALUES (workspace_id_param, target_user_id, role_param)
  ON CONFLICT (workspace_id, user_id)
  DO UPDATE SET role = role_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;