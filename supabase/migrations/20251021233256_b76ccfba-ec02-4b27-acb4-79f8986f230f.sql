-- Add organization column to teams table
ALTER TABLE public.teams 
ADD COLUMN organization text;

COMMENT ON COLUMN public.teams.organization IS 'The FIRST organization type (FRC or FTC)';
