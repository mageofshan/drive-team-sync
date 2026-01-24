-- Add created_by column to teams table to track ownership
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update RLS policies for teams to allow creators to view/update their teams
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

CREATE POLICY "Users can view teams they belong to or created" 
ON public.teams 
FOR SELECT 
USING (
    id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
    OR 
    created_by = auth.uid()
);

-- Update create policy to enforce created_by
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;

CREATE POLICY "Authenticated users can create teams" 
ON public.teams 
FOR INSERT 
TO authenticated 
WITH CHECK (
    -- Allow creation, ensure created_by is set to current user if provided
    -- (If created_by is NULL, it will pass this check if we don't strictly enforce it here, 
    -- but best practice is to require it matches auth.uid() for tracking)
    auth.uid() = created_by
);

-- Update update policy to allow creators to update
DROP POLICY IF EXISTS "Team admins can update their team" ON public.teams;

CREATE POLICY "Team admins and creators can update their team" 
ON public.teams 
FOR UPDATE 
USING (
    id IN (
        SELECT team_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR 
    created_by = auth.uid()
);

-- Functions to handle Team Creation transactionally (Fixes UX flow gap)
CREATE OR REPLACE FUNCTION public.create_team_with_profile(
    p_name TEXT,
    p_team_number INTEGER DEFAULT NULL,
    p_organization public.first_organization DEFAULT 'FRC',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_team_id UUID;
BEGIN
    -- 1. Create the team
    INSERT INTO public.teams (name, team_number, organization, description, created_by)
    VALUES (p_name, p_team_number, p_organization, p_description, auth.uid())
    RETURNING id INTO v_team_id;

    -- 2. Update the profile to join the team as admin
    UPDATE public.profiles
    SET 
        team_id = v_team_id,
        role = 'admin'
    WHERE user_id = auth.uid();

    RETURN v_team_id;
END;
$$;
