import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      user: "Sarah Chen",
      initials: "SC",
      action: "completed task",
      target: "Design intake mechanism",
      time: "2 hours ago",
      type: "task",
    },
    {
      id: 2,
      user: "Mike Rodriguez",
      initials: "MR",
      action: "joined carpool",
      target: "Regional Competition",
      time: "4 hours ago",
      type: "carpool",
    },
    {
      id: 3,
      user: "Alex Thompson",
      initials: "AT",
      action: "added expense",
      target: "$450 for motors",
      time: "6 hours ago",
      type: "budget",
    },
    {
      id: 4,
      user: "Emma Davis",
      initials: "ED",
      action: "scheduled meeting",
      target: "Programming review",
      time: "1 day ago",
      type: "calendar",
    },
    {
      id: 5,
      user: "Jordan Kim",
      initials: "JK",
      action: "marked absent",
      target: "Build session",
      time: "2 days ago",
      type: "attendance",
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task":
        return "bg-success text-white";
      case "carpool":
        return "bg-first-blue text-white";
      case "budget":
        return "bg-first-red text-white";
      case "calendar":
        return "bg-warning text-white";
      case "attendance":
        return "bg-tech-gray text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="border-border shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs bg-tech-gray-light text-tech-gray">
                {activity.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{activity.user}</span>{" "}
                {activity.action}{" "}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
            <Badge className={`text-xs ${getActivityColor(activity.type)}`}>
              {activity.type}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;