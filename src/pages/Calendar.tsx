import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, View, Event as CalendarEvent } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { 
  Plus, 
  Filter, 
  CalendarIcon,
  Clock, 
  Trophy,
  Target,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEventData extends CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'event' | 'task' | 'competition' | 'hours';
  description?: string;
  assigned_to?: string;
  category?: string;
  priority?: string;
  hours?: number;
  team_id: string;
  created_by: string;
  assigned_user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

const eventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start_time: z.date(),
  end_time: z.date(),
  event_type: z.enum(['meeting', 'competition', 'practice', 'outreach', 'other']),
  assigned_to: z.string().optional(),
  location: z.string().optional(),
  hours: z.coerce.number().min(0).optional(),
});

const TeamCalendar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [tasks, setTasks] = useState<CalendarEventData[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      event_type: 'meeting',
    },
  });

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchTasks();
      fetchTeamMembers();
      setupRealtimeUpdates();
    }
  }, [user]);

  const setupRealtimeUpdates = () => {
    const eventsChannel = supabase
      .channel('calendar-events')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          fetchEvents();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(eventsChannel);
    };
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedEvents: CalendarEventData[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
        type: 'event' as const,
        description: event.description,
        team_id: event.team_id,
        created_by: event.created_by,
        category: event.event_type,
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:profiles!fk_tasks_assigned_to_profiles(
            first_name,
            last_name,
            email
          )
        `)
        .not('due_date', 'is', null);

      if (error) throw error;

      const formattedTasks: CalendarEventData[] = (data || []).map(task => ({
        id: task.id,
        title: `📋 ${task.title}`,
        start: new Date(task.due_date),
        end: new Date(task.due_date),
        type: 'task' as const,
        description: task.description,
        assigned_to: task.assigned_to,
        priority: task.priority,
        team_id: task.team_id,
        created_by: task.created_by,
        assigned_user: Array.isArray(task.assigned_user) ? task.assigned_user[0] : task.assigned_user,
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email')
        .not('team_id', 'is', null);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    try {
      // Get user's team_id from their profile
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!userProfile?.team_id) {
        toast({
          title: 'Error',
          description: 'Please join a team to create events',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('events').insert({
        title: values.title,
        description: values.description || null,
        start_time: values.start_time.toISOString(),
        end_time: values.end_time.toISOString(),
        event_type: values.event_type,
        location: values.location || null,
        created_by: user!.id,
        team_id: userProfile.team_id,
      });

      if (error) throw error;

      // Log work hours if specified
      if (values.hours && values.hours > 0) {
        await supabase.from('finances').insert({
          type: 'income',
          amount: values.hours,
          description: `Work hours: ${values.title}`,
          date: values.start_time.toISOString().split('T')[0],
          created_by: user!.id,
          team_id: userProfile.team_id,
          category: 'Work Hours',
        });
      }

      toast({
        title: 'Success',
        description: 'Event created successfully',
      });

      setIsCreateOpen(false);
      setSelectedSlot(null);
      form.reset();
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event',
        variant: 'destructive',
      });
    }
  };

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    form.setValue('start_time', start);
    form.setValue('end_time', end);
    setIsCreateOpen(true);
  }, [form]);

  const handleEventSelect = useCallback((event: CalendarEventData) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  }, []);

  const handleRSVP = async (eventId: string, status: 'yes' | 'no' | 'maybe') => {
    try {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user!.id,
          status: status,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `RSVP updated to ${status}`,
      });
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast({
        title: 'Error',
        description: 'Failed to update RSVP',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAttendance = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert({
          event_id: eventId,
          user_id: user!.id,
          status: 'present',
          checked_in_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const getEventStyle = (event: CalendarEventData) => {
    const baseStyle = {
      borderRadius: '4px',
      border: 'none',
      fontSize: '12px',
      fontWeight: '500',
    };

    switch (event.type) {
      case 'event':
        if (event.category === 'competition') {
          return { ...baseStyle, backgroundColor: '#dc2626', color: 'white' }; // red
        }
        return { ...baseStyle, backgroundColor: '#2563eb', color: 'white' }; // blue
      case 'task':
        const priorityColors = {
          urgent: '#dc2626', // red
          high: '#ea580c', // orange
          medium: '#2563eb', // blue
          low: '#16a34a', // green
        };
        return { 
          ...baseStyle, 
          backgroundColor: priorityColors[event.priority as keyof typeof priorityColors] || '#6b7280',
          color: 'white'
        };
      case 'hours':
        return { ...baseStyle, backgroundColor: '#059669', color: 'white' }; // emerald
      default:
        return { ...baseStyle, backgroundColor: '#6b7280', color: 'white' }; // gray
    }
  };

  const filteredEvents = [...events, ...tasks].filter(event => {
    const matchesType = typeFilter === 'all' || event.type === typeFilter || 
                       (typeFilter === 'competition' && event.category === 'competition');
    const matchesMember = memberFilter === 'all' || 
                         event.assigned_to === memberFilter || 
                         event.created_by === memberFilter;
    
    return matchesType && matchesMember;
  });

  // Calculate statistics
  const totalEvents = events.length;
  const totalTasks = tasks.length;
  const upcomingDeadlines = tasks.filter(task => 
    task.start >= new Date() && 
    task.start <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  const nextCompetition = events.find(event => 
    event.category === 'competition' && event.start >= new Date()
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-subtle">
          <Navbar />
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">Loading calendar...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        
        <main className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Team Calendar</h1>
                <p className="text-muted-foreground">
                  Collaborative scheduling and event management
                </p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-first-blue to-first-red text-white shadow-glow">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Create a new event for your team. Choose the event type and fill in the details.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter event title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter event description" 
                                {...field} 
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="start_time"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "MMM d, HH:mm")
                                      ) : (
                                        <span>Pick start time</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarPicker
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      if (date) {
                                        const currentTime = field.value || new Date();
                                        const newDate = new Date(date);
                                        newDate.setHours(currentTime.getHours());
                                        newDate.setMinutes(currentTime.getMinutes());
                                        field.onChange(newDate);
                                      }
                                    }}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                  <div className="p-3 border-t">
                                    <Input
                                      type="time"
                                      value={field.value ? format(field.value, "HH:mm") : ""}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':');
                                        const newDate = new Date(field.value || new Date());
                                        newDate.setHours(parseInt(hours));
                                        newDate.setMinutes(parseInt(minutes));
                                        field.onChange(newDate);
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="end_time"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Time</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "MMM d, HH:mm")
                                      ) : (
                                        <span>Pick end time</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarPicker
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                      if (date) {
                                        const currentTime = field.value || new Date();
                                        const newDate = new Date(date);
                                        newDate.setHours(currentTime.getHours());
                                        newDate.setMinutes(currentTime.getMinutes());
                                        field.onChange(newDate);
                                      }
                                    }}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                  <div className="p-3 border-t">
                                    <Input
                                      type="time"
                                      value={field.value ? format(field.value, "HH:mm") : ""}
                                      onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':');
                                        const newDate = new Date(field.value || new Date());
                                        newDate.setHours(parseInt(hours));
                                        newDate.setMinutes(parseInt(minutes));
                                        field.onChange(newDate);
                                      }}
                                    />
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="event_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select event type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="competition">Competition</SelectItem>
                                <SelectItem value="practice">Practice</SelectItem>
                                <SelectItem value="outreach">Outreach</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Work Hours (if applicable)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Enter hours worked" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        Create Event
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-border shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-first-blue-light rounded-lg">
                      <CalendarIcon className="w-6 h-6 text-first-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                      <p className="text-2xl font-bold text-foreground">{totalEvents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Target className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Tasks</p>
                      <p className="text-2xl font-bold text-foreground">{totalTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-first-red" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Due This Week</p>
                      <p className="text-2xl font-bold text-foreground">{upcomingDeadlines}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Trophy className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Competition</p>
                      <p className="text-sm font-bold text-foreground">
                        {nextCompetition ? format(nextCompetition.start, 'MMM d') : 'None scheduled'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar Controls */}
            <Card className="border-border shadow-soft mb-6">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={view === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('month')}
                    >
                      Month
                    </Button>
                    <Button
                      variant={view === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={view === 'day' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('day')}
                    >
                      Day
                    </Button>
                    <Button
                      variant={view === 'agenda' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('agenda')}
                    >
                      Agenda
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Event Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="event">Events</SelectItem>
                        <SelectItem value="task">Tasks</SelectItem>
                        <SelectItem value="competition">Competitions</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={memberFilter} onValueChange={setMemberFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Team Member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Members</SelectItem>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fetchEvents();
                        fetchTasks();
                      }}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-4 ml-auto">
                    {/* Legend */}
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-first-blue rounded"></div>
                        <span>Events</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-first-red rounded"></div>
                        <span>Competitions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-warning rounded"></div>
                        <span>Tasks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <Card className="border-border shadow-soft">
            <CardContent className="p-6">
              <div style={{ height: '600px' }}>
                <Calendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  view={view}
                  onView={setView}
                  date={date}
                  onNavigate={setDate}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleEventSelect}
                  selectable
                  eventPropGetter={(event) => ({
                    style: getEventStyle(event as CalendarEventData)
                  })}
                  components={{
                    event: ({ event }) => (
                      <div className="flex items-center space-x-1 text-xs">
                        <span className="truncate">{event.title}</span>
                        {(event as CalendarEventData).assigned_user && (
                          <Users className="w-3 h-3 flex-shrink-0" />
                        )}
                      </div>
                    ),
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Event Details Dialog */}
          <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedEvent?.title}</DialogTitle>
                <DialogDescription>
                  View event details and manage your attendance for this event.
                </DialogDescription>
              </DialogHeader>
              {selectedEvent && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {format(selectedEvent.start, 'PPP p')} - {format(selectedEvent.end, 'p')}
                    </p>
                    {selectedEvent.description && (
                      <p className="text-sm">{selectedEvent.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {selectedEvent.type === 'event' && (
                      <>
                        <div>
                          <h4 className="font-medium mb-2">RSVP</h4>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleRSVP(selectedEvent.id, 'yes')}
                              className="bg-success hover:bg-success/80"
                            >
                              Yes
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRSVP(selectedEvent.id, 'maybe')}
                            >
                              Maybe
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRSVP(selectedEvent.id, 'no')}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                        
                        {selectedEvent.category === 'practice' && (
                          <div>
                            <h4 className="font-medium mb-2">Attendance</h4>
                            <Button
                              size="sm"
                              onClick={() => handleMarkAttendance(selectedEvent.id)}
                              className="bg-first-blue hover:bg-first-blue/80"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark Present
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default TeamCalendar;