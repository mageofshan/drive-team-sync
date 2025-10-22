-- Drop existing policies and recreate with proper permissions
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

-- Allow authenticated users to create teams
CREATE POLICY "Authenticated users can create teams" 
ON public.teams 
FOR INSERT 
TO authenticated
WITH CHECK (true);