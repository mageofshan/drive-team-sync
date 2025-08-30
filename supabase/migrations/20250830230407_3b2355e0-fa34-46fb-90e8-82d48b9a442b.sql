-- Create enum for message types
CREATE TYPE message_type AS ENUM ('chat', 'task', 'carpool', 'resource');

-- Create enum for resource categories
CREATE TYPE resource_category AS ENUM ('cad', 'code', 'mechanical', 'electrical', 'general');

-- Create messages table
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    message_type message_type NOT NULL DEFAULT 'chat',
    content TEXT NOT NULL,
    file_url TEXT,
    file_name TEXT,
    task_id UUID,
    carpool_id UUID,
    resource_category resource_category,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mentions table
CREATE TABLE public.mentions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID NOT NULL,
    mentioned_user_id UUID,
    mentioned_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages in their team"
ON public.messages
FOR SELECT
USING (team_id IN (
    SELECT team_id FROM profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Team members can create messages"
ON public.messages
FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT team_id FROM profiles WHERE user_id = auth.uid()
    ) AND auth.uid() = user_id
);

CREATE POLICY "Message creators can update their messages"
ON public.messages
FOR UPDATE
USING (user_id = auth.uid());

-- RLS policies for mentions
CREATE POLICY "Users can view mentions in their team"
ON public.mentions
FOR SELECT
USING (message_id IN (
    SELECT id FROM messages WHERE team_id IN (
        SELECT team_id FROM profiles WHERE user_id = auth.uid()
    )
));

CREATE POLICY "Team members can create mentions"
ON public.mentions
FOR INSERT
WITH CHECK (message_id IN (
    SELECT id FROM messages WHERE team_id IN (
        SELECT team_id FROM profiles WHERE user_id = auth.uid()
    )
));

-- Create updated_at trigger for messages
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();