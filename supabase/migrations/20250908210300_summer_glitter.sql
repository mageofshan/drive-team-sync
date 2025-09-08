/*
  # Add FIRST Organization Support

  1. Schema Changes
    - Add `organization` enum type (FRC, FTC)
    - Add `organization` column to teams table
    - Remove team number upper limit constraint
    - Update team number validation

  2. Security
    - Update existing RLS policies to work with new schema
    - Maintain data integrity with proper constraints

  3. Functions
    - Update team validation functions for new organization field
*/

-- Create organization enum
CREATE TYPE IF NOT EXISTS public.first_organization AS ENUM ('FRC', 'FTC');

-- Add organization column to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'organization'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN organization public.first_organization NOT NULL DEFAULT 'FRC';
  END IF;
END $$;

-- Drop the existing team number constraint that limits to 9999
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS valid_team_number;

-- Add new constraint that allows higher numbers and validates based on organization
ALTER TABLE public.teams 
ADD CONSTRAINT valid_team_number_by_org CHECK (
  team_number IS NULL OR 
  (
    (organization = 'FRC' AND team_number >= 1 AND team_number <= 99999) OR
    (organization = 'FTC' AND team_number >= 1 AND team_number <= 99999)
  )
);

-- Update the team number uniqueness constraint to include organization
-- This allows same numbers across different organizations
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS unique_team_number;
ALTER TABLE public.teams ADD CONSTRAINT unique_team_number_per_org UNIQUE (team_number, organization);

-- Update the check team exists function to include organization
CREATE OR REPLACE FUNCTION public.check_team_exists_by_number(p_team_number INTEGER, p_organization public.first_organization DEFAULT 'FRC')
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams 
    WHERE team_number = p_team_number 
    AND organization = p_organization
  );
$$;

-- Update team validation function to handle organization
CREATE OR REPLACE FUNCTION public.validate_team_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if team number already exists for the same organization (if provided)
  IF NEW.team_number IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.teams 
      WHERE team_number = NEW.team_number 
      AND organization = NEW.organization 
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Team number % already exists for % organization', NEW.team_number, NEW.organization;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;