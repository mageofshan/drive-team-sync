import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";

const UpcomingEvents = () => {
  const events = [
    {
      id: 1,
      title: "Design Review Meeting",
      date: "Today",
      time: "4:00 PM",
      location: "Workshop Room B",
      attendees: 12,
      type: "meeting",
      status: "confirmed",
    },
    {
      id: 2,
      title: "Bay Area Regional",
      date: "Mar 15-17",
      time: "All Day",
      location: "San Jose Convention Center",
      attendees: 24,
      type: "competition",
      status: "upcoming",
    },
    {
      id: 3,
      title: "Programming Workshop",
      date: "Tomorrow",
      time: "6:00 PM",
      location: "Computer Lab",
      attendees: 8,
      type: "workshop",
      status: "needs-rsvp",
    },
  ];

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