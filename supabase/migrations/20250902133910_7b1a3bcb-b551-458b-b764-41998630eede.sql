-- Fix foreign key relationships between tasks and profiles
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_assigned_to_profiles 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(user_id);

ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_created_by_profiles 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

-- Fix foreign key relationships for events table
ALTER TABLE public.events 
ADD CONSTRAINT fk_events_created_by_profiles 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

-- Fix foreign key relationships for other tables that reference user_id
ALTER TABLE public.finances 
ADD CONSTRAINT fk_finances_created_by_profiles 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

ALTER TABLE public.carpools 
ADD CONSTRAINT fk_carpools_driver_profiles 
FOREIGN KEY (driver_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.carpool_riders 
ADD CONSTRAINT fk_carpool_riders_rider_profiles 
FOREIGN KEY (rider_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.messages 
ADD CONSTRAINT fk_messages_user_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.attendance 
ADD CONSTRAINT fk_attendance_user_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.event_rsvps 
ADD CONSTRAINT fk_event_rsvps_user_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.mentions 
ADD CONSTRAINT fk_mentions_mentioned_user_profiles 
FOREIGN KEY (mentioned_user_id) REFERENCES public.profiles(user_id);