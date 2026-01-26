-- Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    team_id UUID REFERENCES public.teams(id) NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    period TEXT CHECK (period IN ('monthly', 'yearly')) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view budgets of their team" 
ON public.budgets FOR SELECT 
USING (
    team_id IN (
        SELECT team_id FROM public.profiles 
        WHERE user_id = auth.uid()
    )
    OR 
    created_by = auth.uid()
);

CREATE POLICY "Team admins can manage budgets" 
ON public.budgets FOR ALL 
USING (
    team_id IN (
        SELECT team_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR 
    created_by = auth.uid()
);

-- Fix for Finances.tsx 'default-team-id'
-- We don't need a migration for the React code fix, but we'll do it in the next step.
