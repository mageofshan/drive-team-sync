import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTeamStatus } from "@/hooks/useTeamStatus";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeamInviteCode from "@/components/TeamInviteCode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Trophy } from "lucide-react";

interface TeamData {
  id: string;
  name: string;
  organization: 'FRC' | 'FTC';
  team_number: number;
  first_region: string;
  description: string;
  member_count: number;
}

const TeamInfo = () => {
  const { user } = useAuth();
  const { teamId } = useTeamStatus();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamId) return;

      try {
        // Fetch team data
        const { data: team, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (teamError) throw teamError;

        // Count team members
        const { count: memberCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', teamId);

        setTeamData({
          ...team,
          member_count: memberCount || 0
        });
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-first-blue mb-8">Team Information</h1>
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="animate-pulse bg-muted h-6 w-3/4 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="animate-pulse bg-muted h-4 w-full rounded mb-2"></div>
                  <div className="animate-pulse bg-muted h-4 w-2/3 rounded"></div>
                </CardContent>
              </Card>
            </div>
          ) : teamData ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-first-gold" />
                    {teamData.organization} Team {teamData.team_number} - {teamData.name}
                  </CardTitle>
                  <CardDescription>
                    {teamData.organization === 'FRC' ? 'FIRST Robotics Competition' : 'FIRST Tech Challenge'} Team
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{teamData.first_region}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{teamData.member_count} members</span>
                  </div>

                  {teamData.description && (
                    <div>
                      <h4 className="font-semibold mb-2">About Our Team</h4>
                      <p className="text-sm text-muted-foreground">
                        {teamData.description}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <TeamInviteCode teamId={teamData.id} />
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No team data found.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TeamInfo;