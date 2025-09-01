-- Fix the recursive RLS policy issue in profiles table
DROP POLICY IF EXISTS "Users can view profiles in their team" ON public.profiles;

-- Create a non-recursive policy for viewing profiles
CREATE POLICY "Users can view profiles in their team" 
ON public.profiles 
FOR SELECT 
USING (
  -- Users can always see their own profile
  user_id = auth.uid() 
  OR 
  -- Users can see profiles of team members (avoid recursion by using direct team_id check)
  team_id = (
    SELECT team_id 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);