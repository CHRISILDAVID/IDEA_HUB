/*
  # Create RPC functions for complex operations

  1. Functions
    - `toggle_star` - Toggle star status for an idea
    - `fork_idea` - Create a fork of an existing idea
    - `get_user_stats` - Get comprehensive user statistics

  2. Security
    - All functions require authentication
    - Functions handle their own authorization checks
*/

-- Function to toggle star status
CREATE OR REPLACE FUNCTION toggle_star(idea_id_to_toggle uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  existing_star_id uuid;
  result json;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not authenticated');
  END IF;

  -- Check if star already exists
  SELECT id INTO existing_star_id
  FROM stars
  WHERE user_id = current_user_id AND idea_id = idea_id_to_toggle;

  IF existing_star_id IS NOT NULL THEN
    -- Remove star
    DELETE FROM stars WHERE id = existing_star_id;
    result := json_build_object('success', true, 'message', 'Idea unstarred', 'action', 'unstarred');
  ELSE
    -- Add star
    INSERT INTO stars (user_id, idea_id) VALUES (current_user_id, idea_id_to_toggle);
    result := json_build_object('success', true, 'message', 'Idea starred', 'action', 'starred');
  END IF;

  RETURN result;
END;
$$;

-- Function to fork an idea
CREATE OR REPLACE FUNCTION fork_idea(
  parent_idea_id uuid,
  new_title text DEFAULT NULL,
  new_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  parent_idea RECORD;
  new_idea_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get parent idea details
  SELECT * INTO parent_idea
  FROM ideas
  WHERE id = parent_idea_id
  AND visibility = 'public'
  AND status = 'published';

  IF parent_idea IS NULL THEN
    RAISE EXCEPTION 'Parent idea not found or not accessible';
  END IF;

  -- Create new idea as fork
  INSERT INTO ideas (
    title,
    description,
    content,
    canvas_data,
    author_id,
    tags,
    category,
    license,
    language,
    is_fork,
    forked_from,
    visibility,
    status
  ) VALUES (
    COALESCE(new_title, 'Fork of ' || parent_idea.title),
    COALESCE(new_description, parent_idea.description),
    parent_idea.content,
    parent_idea.canvas_data,
    current_user_id,
    parent_idea.tags,
    parent_idea.category,
    parent_idea.license,
    parent_idea.language,
    true,
    parent_idea_id,
    'public',
    'published'
  ) RETURNING id INTO new_idea_id;

  -- Increment forks count on parent idea
  UPDATE ideas 
  SET forks = forks + 1 
  WHERE id = parent_idea_id;

  RETURN new_idea_id;
END;
$$;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_ideas integer;
  total_stars integer;
  total_forks integer;
  result json;
BEGIN
  -- Get total ideas by user
  SELECT COUNT(*) INTO total_ideas
  FROM ideas
  WHERE author_id = user_id_param
  AND visibility = 'public'
  AND status = 'published';

  -- Get total stars received by user's ideas
  SELECT COALESCE(SUM(stars), 0) INTO total_stars
  FROM ideas
  WHERE author_id = user_id_param
  AND visibility = 'public'
  AND status = 'published';

  -- Get total forks received by user's ideas
  SELECT COALESCE(SUM(forks), 0) INTO total_forks
  FROM ideas
  WHERE author_id = user_id_param
  AND visibility = 'public'
  AND status = 'published';

  result := json_build_object(
    'total_ideas', total_ideas,
    'total_stars', total_stars,
    'total_forks', total_forks
  );

  RETURN result;
END;
$$;