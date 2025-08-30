import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Users, Car, FileText, Send, Pin, Filter, Search, Calendar, UserCheck, Upload } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";

type MessageType = "chat" | "task" | "carpool" | "resource";
type ResourceCategory = "cad" | "code" | "mechanical" | "electrical" | "general";

interface Message {
  id: string;
  content: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  task_id?: string;
  carpool_id?: string;
  resource_category?: ResourceCategory;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  profiles: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  tasks?: {
    title: string;
    priority: string;
  };
  carpools?: {
    departure_location: string;
    departure_time: string;
    available_seats: number;
  };
}

interface TeamMember {
  user_id: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

const Team = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newMessage, setNewMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("chat");
  const [resourceCategory, setResourceCategory] = useState<ResourceCategory>("general");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState<MessageType | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchMessages();
      fetchTeamMembers();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user?.id)
      .single();
    setUserProfile(data);
  };

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error", 
        description: "Failed to load messages",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch profile data separately for each message
    const messagesWithProfiles = await Promise.all(
      (data || []).map(async (message) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("user_id", message.user_id)
          .single();

        return {
          ...message,
          profiles: profile || { first_name: "", last_name: "", avatar_url: "" }
        };
      })
    );

    setMessages(messagesWithProfiles);
    setLoading(false);
  };

  const fetchTeamMembers = async () => {
    if (!userProfile?.team_id) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_url")
      .eq("team_id", userProfile.team_id);
    
    setTeamMembers(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile?.team_id) return;

    const messageData = {
      content: newMessage,
      message_type: messageType,
      team_id: userProfile.team_id,
      user_id: user?.id,
      resource_category: messageType === "resource" ? resourceCategory : null,
    };

    const { error } = await supabase
      .from("messages")
      .insert([messageData]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      setMessageType("chat");
      setIsDialogOpen(false);
      fetchMessages();
      toast({
        title: "Success",
        description: "Message sent!",
      });
    }
  };

  const togglePin = async (messageId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from("messages")
      .update({ is_pinned: !currentPinned })
      .eq("id", messageId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update pin status",
        variant: "destructive",
      });
    } else {
      fetchMessages();
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesType = filterType === "all" || message.message_type === filterType;
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (message.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (message.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesType && matchesSearch;
  });

  const pinnedMessages = filteredMessages.filter(msg => msg.is_pinned);
  const regularMessages = filteredMessages.filter(msg => !msg.is_pinned);

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case "task": return <UserCheck className="w-4 h-4" />;
      case "carpool": return <Car className="w-4 h-4" />;
      case "resource": return <FileText className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getMessageTypeColor = (type: MessageType) => {
    switch (type) {
      case "task": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "carpool": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "resource": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const MessageCard = ({ message }: { message: Message }) => (
    <Card className={`mb-4 transition-all hover:shadow-md ${message.is_pinned ? 'border-yellow-500/50 bg-yellow-50/50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={message.profiles?.avatar_url} />
              <AvatarFallback>
                {message.profiles?.first_name?.[0]}{message.profiles?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {message.profiles?.first_name} {message.profiles?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(message.created_at), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getMessageTypeColor(message.message_type)}>
              {getMessageIcon(message.message_type)}
              <span className="ml-1 capitalize">{message.message_type}</span>
            </Badge>
            {message.user_id === user?.id && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePin(message.id, message.is_pinned)}
                className={message.is_pinned ? 'text-yellow-600' : 'text-gray-400'}
              >
                <Pin className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-3">{message.content}</p>
        
        {message.message_type === "resource" && message.resource_category && (
          <Badge variant="secondary" className="mb-2">
            {message.resource_category.toUpperCase()}
          </Badge>
        )}
        
        {message.tasks && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-medium text-sm">Task: {message.tasks.title}</p>
            <Badge variant="outline" className="mt-1">
              {message.tasks.priority} priority
            </Badge>
          </div>
        )}
        
        {message.carpools && (
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="font-medium text-sm">Carpool from {message.carpools.departure_location}</p>
            <p className="text-xs text-gray-600">
              {format(new Date(message.carpools.departure_time), "MMM d, h:mm a")} • 
              {message.carpools.available_seats} seats available
            </p>
          </div>
        )}
        
        {message.file_name && (
          <div className="bg-gray-50 p-2 rounded border mt-2 flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span className="text-sm">{message.file_name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Team Collaboration</h1>
                  <p className="text-muted-foreground">Connect, share, and collaborate with your team</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="w-4 h-4 mr-2" />
                      New Message
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Send Message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={messageType} onValueChange={(value: MessageType) => setMessageType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Message type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chat">General Chat</SelectItem>
                          <SelectItem value="task">Task Sharing</SelectItem>
                          <SelectItem value="carpool">Carpool Request</SelectItem>
                          <SelectItem value="resource">Resource Sharing</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {messageType === "resource" && (
                        <Select value={resourceCategory} onValueChange={(value: ResourceCategory) => setResourceCategory(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Resource category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cad">CAD Design</SelectItem>
                            <SelectItem value="code">Code</SelectItem>
                            <SelectItem value="mechanical">Mechanical</SelectItem>
                            <SelectItem value="electrical">Electrical</SelectItem>
                            <SelectItem value="general">General</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={4}
                      />
                      
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSendMessage}>Send Message</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterType} onValueChange={(value: MessageType | "all") => setFilterType(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="chat">Chat Only</SelectItem>
                    <SelectItem value="task">Tasks Only</SelectItem>
                    <SelectItem value="carpool">Carpools Only</SelectItem>
                    <SelectItem value="resource">Resources Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages */}
              <div>
                {pinnedMessages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Pin className="w-4 h-4 mr-2 text-yellow-600" />
                      Pinned Messages
                    </h3>
                    {pinnedMessages.map((message) => (
                      <MessageCard key={message.id} message={message} />
                    ))}
                  </div>
                )}

                <div>
                  {regularMessages.length === 0 ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    regularMessages.map((message) => (
                      <MessageCard key={message.id} message={message} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Team Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {messages.filter(m => m.message_type === "task").length}
                      </p>
                      <p className="text-xs text-blue-600">Shared Tasks</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {messages.filter(m => m.message_type === "carpool").length}
                      </p>
                      <p className="text-xs text-green-600">Carpool Posts</p>
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {messages.filter(m => m.message_type === "resource").length}
                    </p>
                    <p className="text-xs text-purple-600">Shared Resources</p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Team Members ({teamMembers.length})</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamMembers.map((member) => (
                        <div key={member.user_id} className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {member.first_name?.[0]}{member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {member.first_name} {member.last_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Team;