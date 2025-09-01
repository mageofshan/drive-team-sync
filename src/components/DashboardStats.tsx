import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DashboardStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState([
    {
      title: "Team Members",
      value: "0",
      description: "Active this season",
      icon: Users,
      color: "text-first-blue",
      bgColor: "bg-first-blue-light",
    },
    {
      title: "Upcoming Events",
      value: "0",
      description: "Next 7 days",
      icon: Calendar,
      color: "text-warning",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Tasks Completed",
      value: "0%",
      description: "This week",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-green-50",
    },
    {
      title: "Budget Used",
      value: "$0",
      description: "of total budget",
      icon: DollarSign,
      color: "text-first-red",
      bgColor: "bg-first-red-light",
    },
  ]);

  useEffect(() => {
    if (user) {
      fetchRealData();
    }
  }, [user]);

  const fetchRealData = async () => {
    try {
      // Get user's team ID first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!userProfile?.team_id) return;

      // Fetch team members count
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', userProfile.team_id);

      // Fetch upcoming events (next 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', userProfile.team_id)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', sevenDaysFromNow.toISOString());

      // Fetch tasks completion rate (this week)
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const { count: totalTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', userProfile.team_id)
        .gte('created_at', weekStart.toISOString());

      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('team_id', userProfile.team_id)
        .eq('status', 'done')
        .gte('updated_at', weekStart.toISOString());

      const completionRate = totalTasks ? Math.round((completedTasks! / totalTasks!) * 100) : 0;

      // Fetch budget data
      const { data: expenses } = await supabase
        .from('finances')
        .select('amount')
        .eq('team_id', userProfile.team_id)
        .eq('type', 'expense');

      const { data: income } = await supabase
        .from('finances')
        .select('amount')
        .eq('team_id', userProfile.team_id)
        .eq('type', 'income');

      const totalExpenses = expenses?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
      const totalIncome = income?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

      setStats([
        {
          title: "Team Members",
          value: (membersCount || 0).toString(),
          description: "Active this season",
          icon: Users,
          color: "text-first-blue",
          bgColor: "bg-first-blue-light",
        },
        {
          title: "Upcoming Events",
          value: (eventsCount || 0).toString(),
          description: "Next 7 days",
          icon: Calendar,
          color: "text-warning",
          bgColor: "bg-yellow-50",
        },
        {
          title: "Tasks Completed",
          value: `${completionRate}%`,
          description: "This week",
          icon: CheckCircle,
          color: "text-success",
          bgColor: "bg-green-50",
        },
        {
          title: "Budget Used",
          value: `$${totalExpenses.toLocaleString()}`,
          description: totalIncome > 0 ? `of $${totalIncome.toLocaleString()} total` : "of total budget",
          icon: DollarSign,
          color: "text-first-red",
          bgColor: "bg-first-red-light",
        },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border shadow-soft hover:shadow-medium transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;