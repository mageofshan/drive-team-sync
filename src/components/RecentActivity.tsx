import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Activity {
  id: string;
  user: string;
  initials: string;
  action: string;
  target: string;
  time: string;
  type: string;
}

const RecentActivity = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
    }
  }, [user]);

  const fetchRecentActivity = async () => {
    try {
      // Get user's team ID first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!userProfile?.team_id) return;

      const recentActivities: Activity[] = [];

      // Fetch recent task completions
      // Fetch recent task completions
      const { data: recentTasks } = await supabase
        .from('tasks')
        .select('id, title, updated_at, status, assigned_to')
        .eq('team_id', userProfile.team_id)
        .eq('status', 'done')
        .order('updated_at', { ascending: false })
        .limit(3);

      if (recentTasks && recentTasks.length > 0) {
        // Fetch profiles for the tasks
        const userIds = Array.from(new Set(recentTasks.map(t => t.assigned_to).filter(Boolean)));

        const { data: taskProfiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const profilesMap = new Map(taskProfiles?.map(p => [p.user_id, p]));

        recentTasks.forEach(task => {
          const profile = task.assigned_to ? profilesMap.get(task.assigned_to) : null;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';

          recentActivities.push({
            id: task.id,
            user: `${firstName} ${lastName}`.trim() || 'Unknown User',
            initials: `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'UN',
            action: 'completed task',
            target: task.title,
            time: getTimeAgo(task.updated_at),
            type: 'task'
          });
        });
      }

      // Fetch recent expenses
      // Fetch recent expenses
      const { data: recentExpenses } = await supabase
        .from('finances')
        .select('id, description, amount, created_at, created_by')
        .eq('team_id', userProfile.team_id)
        .eq('type', 'expense')
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentExpenses && recentExpenses.length > 0) {
        const userIds = Array.from(new Set(recentExpenses.map(e => e.created_by).filter(Boolean)));

        const { data: expenseProfiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const profilesMap = new Map(expenseProfiles?.map(p => [p.user_id, p]));

        recentExpenses.forEach(expense => {
          const profile = expense.created_by ? profilesMap.get(expense.created_by) : null;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';

          recentActivities.push({
            id: expense.id,
            user: `${firstName} ${lastName}`.trim() || 'Unknown User',
            initials: `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'UN',
            action: 'added expense',
            target: `$${Number(expense.amount).toLocaleString()} for ${expense.description}`,
            time: getTimeAgo(expense.created_at),
            type: 'budget'
          });
        });
      }

      // Fetch recent events
      // Fetch recent events
      const { data: recentEvents } = await supabase
        .from('events')
        .select('id, title, created_at, created_by')
        .eq('team_id', userProfile.team_id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (recentEvents && recentEvents.length > 0) {
        const userIds = Array.from(new Set(recentEvents.map(e => e.created_by).filter(Boolean)));

        const { data: eventProfiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const profilesMap = new Map(eventProfiles?.map(p => [p.user_id, p]));

        recentEvents.forEach(event => {
          const profile = event.created_by ? profilesMap.get(event.created_by) : null;
          const firstName = profile?.first_name || '';
          const lastName = profile?.last_name || '';

          recentActivities.push({
            id: event.id,
            user: `${firstName} ${lastName}`.trim() || 'Unknown User',
            initials: `${firstName.charAt(0) || ''}${lastName.charAt(0) || ''}`.toUpperCase() || 'UN',
            action: 'scheduled event',
            target: event.title,
            time: getTimeAgo(event.created_at),
            type: 'calendar'
          });
        });
      }

      // Sort all activities by time and take top 5
      recentActivities.sort((a, b) => {
        // This is a simple sort - in production you'd want to parse the time strings properly
        return 0; // Keep current order for now
      });

      setActivities(recentActivities.slice(0, 5));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

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