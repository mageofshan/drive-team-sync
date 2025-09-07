import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw } from 'lucide-react';

interface TeamInviteCodeProps {
  teamId: string;
}

export default function TeamInviteCode({ teamId }: TeamInviteCodeProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!user || !teamId) return;

      try {
        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');

        // Fetch team invite code
        const { data: team } = await supabase
          .from('teams')
          .select('invite_code')
          .eq('id', teamId)
          .single();

        if (team) {
          setInviteCode(team.invite_code);
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user, teamId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: 'Copied to Clipboard',
        description: 'Invite code has been copied to your clipboard.'
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy invite code.',
        variant: 'destructive'
      });
    }
  };

  const regenerateCode = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      // Generate new invite code (this will be handled by the database default)
      const { data: updatedTeam, error } = await supabase
        .from('teams')
        .update({ invite_code: btoa(Math.random().toString()).substring(0, 8) })
        .eq('id', teamId)
        .select('invite_code')
        .single();

      if (error) throw error;

      setInviteCode(updatedTeam.invite_code);
      toast({
        title: 'Invite Code Regenerated',
        description: 'A new invite code has been generated for your team.'
      });
    } catch (error) {
      console.error('Error regenerating invite code:', error);
      toast({
        title: 'Error',
        description: 'Failed to regenerate invite code.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Invite Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse bg-muted h-8 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invite Code</CardTitle>
        <CardDescription>
          Share this code with new members to join your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={inviteCode}
            readOnly
            className="font-mono text-center text-lg"
          />
          <Button onClick={copyToClipboard} variant="outline" size="icon">
            <Copy className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Button 
              onClick={regenerateCode} 
              variant="outline" 
              size="icon"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
        
        {isAdmin && (
          <p className="text-sm text-muted-foreground">
            As a team admin, you can regenerate the invite code if needed.
          </p>
        )}
      </CardContent>
    </Card>
  );
}