import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navbar from "@/components/Navbar";
import DashboardStats from "@/components/DashboardStats";
import RecentActivity from "@/components/RecentActivity";
import UpcomingEvents from "@/components/UpcomingEvents";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Wrench, Target, Trophy, Clock, LogIn, CalendarIcon, CheckCircle2, Users } from "lucide-react";

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.date().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  estimated_hours: z.coerce.number().min(0).optional(),
});

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isLogHoursOpen, setIsLogHoursOpen] = useState(false);
  const [isMarkAttendanceOpen, setIsMarkAttendanceOpen] = useState(false);
  const [hoursToLog, setHoursToLog] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const taskForm = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: 'medium',
    },
  });

  useEffect(() => {
    if (user) {
      fetchTeamMembers();
    }
  }, [user]);

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
    }
  };

  const onCreateTask = async (values: z.infer<typeof taskFormSchema>) => {
    try {
      const { error } = await supabase.from('tasks').insert({
        title: values.title,
        description: values.description || null,
        assigned_to: values.assigned_to || null,
        due_date: values.due_date?.toISOString() || null,
        priority: values.priority,
        estimated_hours: values.estimated_hours || null,
        created_by: user!.id,
        team_id: user!.id,
        status: 'todo',
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      setIsCreateTaskOpen(false);
      taskForm.reset();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleLogHours = async () => {
    if (!hoursToLog) return;

    try {
      await supabase.from('finances').insert({
        type: 'income',
        amount: parseFloat(hoursToLog),
        description: 'Work hours logged',
        date: new Date().toISOString().split('T')[0],
        created_by: user!.id,
        team_id: user!.id,
        category: 'Work Hours',
      });

      toast({
        title: 'Success',
        description: `Logged ${hoursToLog} hours`,
      });

      setIsLogHoursOpen(false);
      setHoursToLog('');
    } catch (error) {
      console.error('Error logging hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to log hours',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAttendance = async () => {
    try {
      await supabase.from('attendance').insert({
        user_id: user!.id,
        status: 'present',
        checked_in_at: new Date().toISOString(),
        event_id: 'practice-session', // This would be a real event ID in practice
      });

      toast({
        title: 'Success',
        description: 'Attendance marked successfully',
      });

      setIsMarkAttendanceOpen(false);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark attendance',
        variant: 'destructive',
      });
    }
  };

  const [teamName, setTeamName] = useState('Team');
  const [teamNumber, setTeamNumber] = useState('');
  const [seasonInfo, setSeasonInfo] = useState('2024 Season');
  const [teamProgress, setTeamProgress] = useState([
    { task: "Robot Design", progress: 0, status: "Unknown" },
    { task: "Programming", progress: 0, status: "Unknown" },
    { task: "Mechanical Build", progress: 0, status: "Unknown" },
    { task: "Electrical Systems", progress: 0, status: "Unknown" },
  ]);

  useEffect(() => {
    if (user) {
      fetchTeamInfo();
      fetchTeamProgress();
    }
  }, [user]);

  const fetchTeamInfo = async () => {
    try {
      // Get user's profile and team info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select(`
          team_id,
          teams!inner(name, team_number)
        `)
        .eq('user_id', user!.id)
        .single();

      if (userProfile?.teams) {
        const team = userProfile.teams as any;
        setTeamName(team.name || 'Team');
        setTeamNumber(team.team_number ? `#${team.team_number}` : '');
      }
    } catch (error) {
      console.error('Error fetching team info:', error);
    }
  };

  const fetchTeamProgress = async () => {
    try {
      // Get user's team ID first
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', user!.id)
        .single();

      if (!userProfile?.team_id) return;

      // Calculate progress based on tasks
      const categories = ['design', 'programming', 'mechanical', 'electrical'];
      const progressData = await Promise.all(
        categories.map(async (category) => {
          const { count: totalTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', userProfile.team_id)
            .contains('tags', [category]);

          const { count: completedTasks } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', userProfile.team_id)
            .eq('status', 'done')
            .contains('tags', [category]);

          const progress = totalTasks ? Math.round((completedTasks! / totalTasks!) * 100) : 0;
          
          let status = "Unknown";
          if (progress >= 90) status = "Ahead";
          else if (progress >= 75) status = "On Track";
          else if (progress >= 50) status = "Needs Attention";
          else if (progress > 0) status = "Behind";

          const taskNames = {
            design: "Robot Design",
            programming: "Programming",
            mechanical: "Mechanical Build",
            electrical: "Electrical Systems"
          };

          return {
            task: taskNames[category as keyof typeof taskNames],
            progress,
            status
          };
        })
      );

      setTeamProgress(progressData);
    } catch (error) {
      console.error('Error fetching team progress:', error);
    }
  };

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
                Welcome back, {teamName} {teamNumber}! 🤖
              </h1>
              <p className="text-muted-foreground">
                {seasonInfo} • Building the future together
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
                <Dialog open={isLogHoursOpen} onOpenChange={setIsLogHoursOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Wrench className="w-4 h-4 mr-2" />
                      Log Work Hours
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Log Work Hours</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Hours Worked</label>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="Enter hours worked"
                          value={hoursToLog}
                          onChange={(e) => setHoursToLog(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsLogHoursOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleLogHours}>
                          Log Hours
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="w-4 h-4 mr-2" />
                      Create New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <Form {...taskForm}>
                      <form onSubmit={taskForm.handleSubmit(onCreateTask)} className="space-y-4">
                        <FormField
                          control={taskForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter task title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={taskForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter task description" 
                                  {...field} 
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="assigned_to"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assign To</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {teamMembers.map((member) => (
                                    <SelectItem key={member.user_id} value={member.user_id}>
                                      {member.first_name} {member.last_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="due_date"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Due Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className="w-full pl-3 text-left font-normal"
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full">
                          Create Task
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={isMarkAttendanceOpen} onOpenChange={setIsMarkAttendanceOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Clock className="w-4 h-4 mr-2" />
                      Mark Attendance
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Mark Attendance</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Mark your attendance for today's session
                      </p>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsMarkAttendanceOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleMarkAttendance}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark Present
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
