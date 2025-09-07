import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface TeamStatus {
  hasTeam: boolean;
  teamId: string | null;
  loading: boolean;
}

export const useTeamStatus = (): TeamStatus => {
  const { user } = useAuth();
  const [teamStatus, setTeamStatus] = useState<TeamStatus>({
    hasTeam: false,
    teamId: null,
    loading: true
  });

  useEffect(() => {
    const checkTeamStatus = async () => {
      if (!user) {
        setTeamStatus({ hasTeam: false, teamId: null, loading: false });
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('team_id')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setTeamStatus({ hasTeam: false, teamId: null, loading: false });
          return;
        }

        setTeamStatus({
          hasTeam: !!profile?.team_id,
          teamId: profile?.team_id || null,
          loading: false
        });
      } catch (error) {
        console.error('Error checking team status:', error);
        setTeamStatus({ hasTeam: false, teamId: null, loading: false });
      }
    };

    checkTeamStatus();
  }, [user]);

  return teamStatus;
};