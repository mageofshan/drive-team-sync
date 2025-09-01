import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

const UpcomingEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user) {
      fetchUpcomingEvents();
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
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;