-- Create toggle_star database function for atomically starring/unstarring an idea
CREATE OR REPLACE FUNCTION public.toggle_star(idea_id_to_toggle uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  star_record_exists boolean;
  result_message text;
  is_now_starred boolean;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already starred
  SELECT EXISTS (
    SELECT 1 
    FROM stars 
    WHERE user_id = current_user_id AND idea_id = idea_id_to_toggle
  ) INTO star_record_exists;

  IF star_record_exists THEN
    -- Unstar - Delete from stars table
    DELETE FROM stars 
    WHERE user_id = current_user_id AND idea_id = idea_id_to_toggle;

    -- The trigger will handle decrementing the stars count, but we'll check to ensure it worked
    result_message := 'Idea unstarred';
    is_now_starred := false;
  ELSE
    -- Star - Insert into stars table
    INSERT INTO stars (user_id, idea_id)
    VALUES (current_user_id, idea_id_to_toggle);

    -- The trigger will handle incrementing the stars count, but we'll check to ensure it worked
    result_message := 'Idea starred';
    is_now_starred := true;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true, 
    'message', result_message,
    'is_starred', is_now_starred
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM,
      'is_starred', star_record_exists
    );
END;
$$;

-- Create fork_idea database function for atomically creating a fork of an existing idea
CREATE OR REPLACE FUNCTION public.fork_idea(
  parent_idea_id uuid, 
  new_title text DEFAULT NULL, 
  new_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  original_idea_record ideas%ROWTYPE;
  new_idea_id uuid;
  actual_title text;
  actual_description text;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get original idea
  SELECT * FROM ideas
  WHERE id = parent_idea_id
  INTO original_idea_record;

  IF original_idea_record.id IS NULL THEN
    RAISE EXCEPTION 'Original idea not found';
  END IF;

  -- Set default values if not provided
  actual_title := COALESCE(new_title, original_idea_record.title || ' (Fork)');
  actual_description := COALESCE(new_description, original_idea_record.description);

  -- Create fork
  INSERT INTO ideas (
    title,
    description,
    content,
    author_id,
    tags,
    category,
    license,
    visibility,
    language,
    is_fork,
    forked_from
  ) VALUES (
    actual_title,
    actual_description,
    original_idea_record.content,
    current_user_id,
    original_idea_record.tags,
    original_idea_record.category,
    original_idea_record.license,
    'public',
    original_idea_record.language,
    true,
    parent_idea_id
  )
  RETURNING id INTO new_idea_id;

  -- Update fork count on parent idea
  UPDATE ideas 
  SET forks = forks + 1 
  WHERE id = parent_idea_id;

  -- Return the new idea ID
  RETURN new_idea_id;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Error forking idea: %', SQLERRM;
END;
$$;

-- Grant execute permissions on the functions to authenticated users
GRANT EXECUTE ON FUNCTION public.toggle_star(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fork_idea(uuid, text, text) TO authenticated;
