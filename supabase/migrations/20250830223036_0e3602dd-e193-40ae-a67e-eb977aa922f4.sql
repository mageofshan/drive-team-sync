-- Enable real-time for events table
ALTER TABLE public.events REPLICA IDENTITY FULL;

-- Add events table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Enable real-time for tasks table (for calendar integration)
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

-- Add tasks table to real-time publication (if not already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;