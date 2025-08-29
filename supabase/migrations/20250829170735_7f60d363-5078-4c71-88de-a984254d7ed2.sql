-- Create enum types
CREATE TYPE public.user_role AS ENUM ('admin', 'code_lead', 'mechanical_lead', 'electrical_lead', 'drive_coach', 'student_mentor', 'student', 'mentor');
CREATE TYPE public.event_type AS ENUM ('meeting', 'practice', 'outreach', 'competition', 'other');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'review', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.finance_type AS ENUM ('income', 'expense');
CREATE TYPE public.income_source AS ENUM ('grant', 'donation', 'sponsorship', 'fundraising', 'other');
CREATE TYPE public.expense_category AS ENUM ('parts', 'travel', 'hotel', 'food', 'registration', 'tools', 'other');

-- Create teams table
CREATE TABLE public.teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    team_number INTEGER UNIQUE,
    invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'base64'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    role public.user_role DEFAULT 'student',
    phone TEXT,
    emergency_contact TEXT,
    dietary_restrictions TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Create events table
CREATE TABLE public.events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type public.event_type NOT NULL DEFAULT 'meeting',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    max_attendees INTEGER,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event RSVPs table
CREATE TABLE public.event_rsvps (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Create carpools table
CREATE TABLE public.carpools (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    departure_location TEXT NOT NULL,
    departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
    return_time TIMESTAMP WITH TIME ZONE,
    available_seats INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create carpool riders table
CREATE TABLE public.carpool_riders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    carpool_id UUID NOT NULL REFERENCES public.carpools(id) ON DELETE CASCADE,
    rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pickup_location TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(carpool_id, rider_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status public.task_status DEFAULT 'todo',
    priority public.task_priority DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL,
    actual_hours DECIMAL,
    tags TEXT[],
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finances table
CREATE TABLE public.finances (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    type public.finance_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    income_source public.income_source,
    expense_category public.expense_category,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'sick', 'excused')),
    notes TEXT,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carpools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carpool_riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for teams
CREATE POLICY "Users can view teams they belong to" ON public.teams
    FOR SELECT USING (id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Team admins can update their team" ON public.teams
    FOR UPDATE USING (id IN (
        SELECT team_id FROM public.profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    ));

-- Create RLS policies for profiles
CREATE POLICY "Users can view profiles in their team" ON public.profiles
    FOR SELECT USING (
        team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can create their own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for events
CREATE POLICY "Users can view events in their team" ON public.events
    FOR SELECT USING (team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Team members can create events" ON public.events
    FOR INSERT WITH CHECK (
        team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        AND auth.uid() = created_by
    );

CREATE POLICY "Event creators and admins can update events" ON public.events
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        team_id IN (
            SELECT team_id FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for event_rsvps
CREATE POLICY "Users can view RSVPs for events in their team" ON public.event_rsvps
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own RSVPs" ON public.event_rsvps
    FOR ALL USING (user_id = auth.uid());

-- Create RLS policies for carpools
CREATE POLICY "Users can view carpools for events in their team" ON public.carpools
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can create carpools for events in their team" ON public.carpools
    FOR INSERT WITH CHECK (
        event_id IN (
            SELECT id FROM public.events 
            WHERE team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        )
        AND auth.uid() = driver_id
    );

CREATE POLICY "Drivers can update their carpools" ON public.carpools
    FOR UPDATE USING (driver_id = auth.uid());

-- Create RLS policies for carpool_riders
CREATE POLICY "Users can view riders for carpools in their team" ON public.carpool_riders
    FOR SELECT USING (
        carpool_id IN (
            SELECT c.id FROM public.carpools c
            JOIN public.events e ON c.event_id = e.id
            WHERE e.team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own carpool rides" ON public.carpool_riders
    FOR ALL USING (rider_id = auth.uid());

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks in their team" ON public.tasks
    FOR SELECT USING (team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Team members can create tasks" ON public.tasks
    FOR INSERT WITH CHECK (
        team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        AND auth.uid() = created_by
    );

CREATE POLICY "Task creators, assignees, and admins can update tasks" ON public.tasks
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        assigned_to = auth.uid() OR
        team_id IN (
            SELECT team_id FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for finances
CREATE POLICY "Users can view finances for their team" ON public.finances
    FOR SELECT USING (team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Team members can create finance records" ON public.finances
    FOR INSERT WITH CHECK (
        team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        AND auth.uid() = created_by
    );

CREATE POLICY "Finance creators and admins can update finance records" ON public.finances
    FOR UPDATE USING (
        created_by = auth.uid() OR
        team_id IN (
            SELECT team_id FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create RLS policies for attendance
CREATE POLICY "Users can view attendance for events in their team" ON public.attendance
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE team_id IN (SELECT team_id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can manage their own attendance" ON public.attendance
    FOR ALL USING (user_id = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_event_rsvps_updated_at BEFORE UPDATE ON public.event_rsvps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carpools_updated_at BEFORE UPDATE ON public.carpools FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finances_updated_at BEFORE UPDATE ON public.finances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, first_name, last_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();