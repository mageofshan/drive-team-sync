import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from "@/components/Navbar";
import DashboardStats from "@/components/DashboardStats";
import RecentActivity from "@/components/RecentActivity";
import UpcomingEvents from "@/components/UpcomingEvents";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wrench, Target, Trophy, Clock, LogIn } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-first-blue to-first-red p-3 rounded-full">
              <Trophy className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">FIRST Tracker</h1>
          <p className="text-muted-foreground mb-6">
            Your robotics team's digital headquarters
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-first-blue to-first-red text-white shadow-glow"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In to Get Started
          </Button>
        </div>
      </div>
    );
  }

  const teamProgress = [
    { task: "Robot Design", progress: 85, status: "On Track" },
    { task: "Programming", progress: 72, status: "Needs Attention" },
    { task: "Mechanical Build", progress: 91, status: "Ahead" },
    { task: "Electrical Systems", progress: 68, status: "Behind" },
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-success";
    if (progress >= 60) return "bg-warning";
    return "bg-first-red";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ahead":
        return "bg-success text-white";
      case "On Track":
        return "bg-first-blue text-white";
      case "Needs Attention":
        return "bg-warning text-white";
      case "Behind":
        return "bg-first-red text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        
        <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, Team 254! 🤖
              </h1>
              <p className="text-muted-foreground">
                2024 CRESCENDO Season • 42 days until Regional Competition
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button className="bg-gradient-to-r from-first-blue to-first-red text-white shadow-glow">
                <Trophy className="w-4 h-4 mr-2" />
                Championship Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8">
          <DashboardStats />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activity */}
          <div className="lg:col-span-1">
            <RecentActivity />
          </div>

          {/* Middle Column - Upcoming Events */}
          <div className="lg:col-span-1">
            <UpcomingEvents />
          </div>

          {/* Right Column - Team Progress */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-semibold text-foreground">
                  Season Progress
                </CardTitle>
                <Target className="w-5 h-5 text-first-blue" />
              </CardHeader>
              <CardContent className="space-y-6">
                {teamProgress.map((item) => (
                  <div key={item.task} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {item.task}
                      </span>
                      <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Progress value={item.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.progress}% complete</span>
                        <span>Target: 100%</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Updated 2 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-border shadow-soft mt-6">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Wrench className="w-4 h-4 mr-2" />
                  Log Work Hours
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Target className="w-4 h-4 mr-2" />
                  Create New Task
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Mark Attendance
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
