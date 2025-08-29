import { Calendar, Users, Car, ClipboardList, DollarSign, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navItems = [
    { icon: BarChart3, label: "Dashboard", active: true },
    { icon: Users, label: "Team" },
    { icon: Calendar, label: "Calendar" },
    { icon: Car, label: "Carpool" },
    { icon: ClipboardList, label: "Tasks" },
    { icon: DollarSign, label: "Budget" },
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
                  variant={item.active ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Team 254 - The Cheesy Poofs
            </div>
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;