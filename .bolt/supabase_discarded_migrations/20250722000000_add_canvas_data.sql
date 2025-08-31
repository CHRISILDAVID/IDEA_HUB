-- Add canvas_data column to ideas table
ALTER TABLE public.ideas 
ADD COLUMN canvas_data TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN public.ideas.canvas_data IS 'JSON string containing canvas objects and state'; 