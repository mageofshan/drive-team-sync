import { Calendar, Users, Car, ClipboardList, DollarSign, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed out",
        description: "You've been successfully signed out",
      });
    }
  };

  const navItems = [
    { icon: BarChart3, label: "Dashboard", path: "/" },
    { icon: Users, label: "Team", path: "/team" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: Car, label: "Transportation", path: "/transportation" },
    { icon: ClipboardList, label: "Tasks", path: "/tasks" },
    { icon: DollarSign, label: "Finances", path: "/finances" },
  ];

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-first-blue to-first-red rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">TeamSync</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              {user?.email || "Team 254 - The Cheesy Poofs"}
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;