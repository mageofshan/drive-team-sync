-- Create security definer function to get current user's team_id
CREATE OR REPLACE FUNCTION public.get_current_user_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop the existing policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles in their team" ON public.profiles;

-- Create new policy using the security definer function
CREATE POLICY "Users can view profiles in their team" ON public.profiles
FOR SELECT USING (
  (user_id = auth.uid()) OR 
  (team_id = public.get_current_user_team_id())
);