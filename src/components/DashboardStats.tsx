import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, CheckCircle, DollarSign } from "lucide-react";

const DashboardStats = () => {
  const stats = [
    {
      title: "Team Members",
      value: "24",
      description: "Active this season",
      icon: Users,
      color: "text-first-blue",
      bgColor: "bg-first-blue-light",
    },
    {
      title: "Upcoming Events",
      value: "3",
      description: "Next 7 days",
      icon: Calendar,
      color: "text-warning",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Tasks Completed",
      value: "87%",
      description: "This week",
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-green-50",
    },
    {
      title: "Budget Used",
      value: "$12,450",
      description: "of $25,000 total",
      icon: DollarSign,
      color: "text-first-red",
      bgColor: "bg-first-red-light",
    },
  ];

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