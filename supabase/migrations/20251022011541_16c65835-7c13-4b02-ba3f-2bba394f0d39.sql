-- Fix RLS policy for team creation
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

CREATE POLICY "Users can create teams" 
ON public.teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);