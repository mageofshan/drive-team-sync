-- Update check_team_exists_by_number function to include organization parameter
DROP FUNCTION IF EXISTS public.check_team_exists_by_number(integer);

CREATE OR REPLACE FUNCTION public.check_team_exists_by_number(
  p_team_number integer,
  p_organization text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE team_number = p_team_number
    AND (p_organization IS NULL OR organization = p_organization)
  );
$$;