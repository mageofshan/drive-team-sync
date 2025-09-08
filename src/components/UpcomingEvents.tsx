import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Globe, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  type: string;
  status: string;
  start_time: string;
  end_time: string;
  event_type: string;
}

interface FirstEvent {
  code: string;
  name: string;
  type: string;
  districtCode?: string;
  dateStart: string;
  dateEnd: string;
  address?: string;
  timezone?: string;
  website?: string;
  webcasts?: Array<{ type: string; channel: string; file?: string }>;
}

interface FtcEvent {
  eventId: string;
  code: string;
  name: string;
  type: string;
  typeName?: string;
  dateStart?: string;
  dateEnd?: string;
  address?: string;
  city?: string;
  stateprov?: string;
  venue?: string;
  website?: string;
  regionCode?: string;
  hybrid?: boolean;
  remote?: boolean;
}

const UpcomingEvents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [firstEvents, setFirstEvents] = useState<FirstEvent[]>([]);
  const [ftcEvents, setFtcEvents] = useState<FtcEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFirstEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('first-events', {
        body: {
          season: new Date().getFullYear(),
          startDate: new Date().toISOString().split('T')[0], // Today
        }
      });

      if (error) {
        throw error;
      }

      // Get next 5 upcoming events
      const upcomingEvents = (data.events || [])
        .filter((event: FirstEvent) => new Date(event.dateStart) >= new Date())
        .slice(0, 5);
      
      setFirstEvents(upcomingEvents);
    } catch (error) {
      console.error('Error fetching FRC events:', error);
      toast({
        title: 'Warning',
        description: 'Could not fetch FRC events. Showing team events only.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFtcEvents = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ftc-events', {
        body: {
          season: new Date().getFullYear()
        }
      });

      if (error) {
        console.error('Error fetching FTC events:', error);
        return;
      }

      // Filter and get next 5 upcoming events (FTC events might not have dates)
      const upcomingEvents = (data?.events || [])
        .filter((event: FtcEvent) => event.dateStart ? new Date(event.dateStart) > new Date() : true)
        .slice(0, 5);
      
      setFtcEvents(upcomingEvents);
    } catch (error) {
      console.error('Error fetching FTC events:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUpcomingEvents();
      fetchFirstEvents();
      fetchFtcEvents();
    }
  }, [user]);

  const fetchUpcomingEvents = async () => {
    try {
      // Get user's team ID first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!userProfile?.team_id) return;

      // Fetch upcoming events
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('*')
        .eq('team_id', userProfile.team_id)
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(3);

      if (upcomingEvents) {
        const eventsWithAttendees = await Promise.all(
          upcomingEvents.map(async (event) => {
            // Get RSVP count for each event
            const { count: attendeeCount } = await supabase
              .from('event_rsvps')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'yes');

            // Check if current user has RSVP'd
            const { data: userRsvp } = await supabase
              .from('event_rsvps')
              .select('status')
              .eq('event_id', event.id)
              .eq('user_id', user!.id)
              .single();

            const startDate = new Date(event.start_time);
            const endDate = new Date(event.end_time);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            let dateString = format(startDate, 'MMM dd');
            if (startDate.toDateString() === today.toDateString()) {
              dateString = 'Today';
            } else if (startDate.toDateString() === tomorrow.toDateString()) {
              dateString = 'Tomorrow';
            }

            const timeString = format(startDate, 'h:mm a');
            
            let status = 'upcoming';
            if (userRsvp) {
              status = userRsvp.status === 'yes' ? 'confirmed' : userRsvp.status === 'maybe' ? 'maybe' : 'declined';
            } else {
              status = 'needs-rsvp';
            }

            return {
              id: event.id,
              title: event.title,
              date: dateString,
              time: timeString,
              location: event.location || 'TBD',
              attendees: attendeeCount || 0,
              type: event.event_type || 'meeting',
              status: status,
              start_time: event.start_time,
              end_time: event.end_time,
              event_type: event.event_type
            };
          })
        );

        setEvents(eventsWithAttendees);
      }
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "competition":
        return "bg-first-red text-white";
      case "meeting":
        return "bg-first-blue text-white";
      case "workshop":
        return "bg-warning text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success text-white";
      case "needs-rsvp":
        return "bg-warning text-white";
      case "upcoming":
        return "bg-tech-gray text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getFirstEventTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'regional':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'district':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'district_championship':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'championship':
        return 'bg-gold-500/20 text-gold-700 dark:text-gold-300';
      default:
        return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
    }
  };

  return (
    <Card className="border-border shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold text-foreground">Upcoming Events</CardTitle>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* FRC Official Events */}
        {firstEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
              Official FRC Events
            </h4>
            {firstEvents.map((event) => (
              <div key={event.code} className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(event.dateStart), 'MMM d')} - {format(new Date(event.dateEnd), 'MMM d')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getFirstEventTypeColor(event.type)}>
                      {event.type}
                    </Badge>
                    {event.districtCode && (
                      <Badge variant="outline">
                        {event.districtCode}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {event.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.address}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {event.website && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={event.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Add to Calendar
                  </Button>
                  <Button size="sm" variant="outline">
                    Plan Transportation
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FTC Official Events */}
        {ftcEvents.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
              Official FTC Events
            </h4>
            {ftcEvents.map((event) => (
              <div key={event.eventId || event.code} className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-950/20 dark:to-blue-950/20">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{event.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {event.dateStart && event.dateEnd ? (
                        <>
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.dateStart), 'MMM d')} - {format(new Date(event.dateEnd), 'MMM d')}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Event details TBA</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getFirstEventTypeColor(event.type)}>
                      {event.typeName || event.type}
                    </Badge>
                    {event.regionCode && (
                      <Badge variant="outline">
                        {event.regionCode}
                      </Badge>
                    )}
                    {event.hybrid && (
                      <Badge variant="outline">Hybrid</Badge>
                    )}
                    {event.remote && (
                      <Badge variant="outline">Remote</Badge>
                    )}
                  </div>
                </div>
                
                {(event.address || event.city || event.venue) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {event.address || [event.venue, event.city, event.stateprov].filter(Boolean).join(', ')}
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {event.website && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={event.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Add to Calendar
                  </Button>
                  <Button size="sm" variant="outline">
                    Plan Transportation
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Events */}
        {events.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide border-b pb-2">
              Team Events
            </h4>
            {events.map((event) => (
              <div key={event.id} className="border border-border rounded-lg p-4 hover:shadow-medium transition-shadow duration-200">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{event.date} at {event.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{event.attendees} attending</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={`text-xs ${getEventColor(event.type)}`}>
                      {event.type}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                      {event.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex space-x-2 mt-3">
                  <Button size="sm" variant="outline" className="text-xs">
                    RSVP
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs">
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {events.length === 0 && firstEvents.length === 0 && ftcEvents.length === 0 && !loading && (
          <p className="text-muted-foreground text-center py-4">
            No upcoming events found.
          </p>
        )}

        {loading && (
          <p className="text-muted-foreground text-center py-4">
            Loading events...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;