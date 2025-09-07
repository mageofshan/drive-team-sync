-- Create user expertise enum
CREATE TYPE public.user_expertise AS ENUM ('mechanical', 'electrical', 'programming', 'outreach', 'business', 'media', 'strategy');

-- Add new fields to teams table
ALTER TABLE public.teams 
ADD COLUMN first_region TEXT,
ADD COLUMN description TEXT,
ADD COLUMN max_members INTEGER DEFAULT 50;

-- Add unique constraint on team_number to prevent duplicates
ALTER TABLE public.teams 
ADD CONSTRAINT unique_team_number UNIQUE (team_number);

-- Add constraint to ensure team_number is in valid FRC range
ALTER TABLE public.teams 
ADD CONSTRAINT valid_team_number CHECK (team_number IS NULL OR (team_number >= 1 AND team_number <= 9999));

-- Add expertise field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN expertise user_expertise[];

-- Add constraint to prevent users from being in multiple teams
-- First, we need to handle existing data - make sure no user is in multiple teams
CREATE UNIQUE INDEX unique_user_team ON public.profiles (user_id) WHERE team_id IS NOT NULL;

-- Create security function to check if team number exists
CREATE OR REPLACE FUNCTION public.check_team_exists_by_number(p_team_number INTEGER)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE team_number = p_team_number
  );
$$;

-- Create function to get user's current team count
CREATE OR REPLACE FUNCTION public.get_user_team_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.profiles 
  WHERE user_id = p_user_id AND team_id IS NOT NULL;
$$;

-- Create function to validate team creation
CREATE OR REPLACE FUNCTION public.validate_team_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if team number already exists (if provided)
  IF NEW.team_number IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.teams WHERE team_number = NEW.team_number AND id != NEW.id) THEN
      RAISE EXCEPTION 'Team number % already exists in the system', NEW.team_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for team validation
CREATE TRIGGER validate_team_creation_trigger
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_team_creation();

-- Create function to validate user team assignment
CREATE OR REPLACE FUNCTION public.validate_user_team_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is already in another team (when adding to a team)
  IF NEW.team_id IS NOT NULL AND (OLD.team_id IS NULL OR OLD.team_id != NEW.team_id) THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = NEW.user_id 
      AND team_id IS NOT NULL 
      AND team_id != NEW.team_id
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'User is already assigned to another team';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for user team assignment validation
CREATE TRIGGER validate_user_team_assignment_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_team_assignment();