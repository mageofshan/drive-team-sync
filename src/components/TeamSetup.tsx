import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus } from 'lucide-react';

const FIRST_REGIONS = [
  'FIRST Chesapeake',
  'FIRST Great Lakes',
  'FIRST Heartland',
  'FIRST Ontario',
  'FIRST Ontario West',
  'FIRST Pacific Northwest',
  'FIRST In Texas',
  'FIRST Mid-Atlantic',
  'FIRST New England',
  'FIRST North Carolina',
  'FIRST Robotics Competition Israel',
  'FIRST Champions',
  'FIRST China',
  'Others'
];

const EXPERTISE_OPTIONS = [
  { id: 'mechanical', label: 'Mechanical Engineering' },
  { id: 'electrical', label: 'Electrical Engineering' },
  { id: 'programming', label: 'Programming/Software' },
  { id: 'outreach', label: 'Outreach & Community' },
  { id: 'business', label: 'Business & Strategy' },
  { id: 'media', label: 'Media & Design' },
  { id: 'strategy', label: 'Game Strategy' }
];

export default function TeamSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Create team form state
  const [createForm, setCreateForm] = useState({
    teamNumber: '',
    teamName: '',
    firstRegion: '',
    description: '',
    expertise: [] as string[]
  });

  // Join team form state
  const [joinForm, setJoinForm] = useState({
    inviteCode: '',
    expertise: [] as string[]
  });

  const handleExpertiseChange = (expertiseId: string, checked: boolean, isCreateForm: boolean) => {
    if (isCreateForm) {
      setCreateForm(prev => ({
        ...prev,
        expertise: checked 
          ? [...prev.expertise, expertiseId]
          : prev.expertise.filter(e => e !== expertiseId)
      }));
    } else {
      setJoinForm(prev => ({
        ...prev,
        expertise: checked 
          ? [...prev.expertise, expertiseId]
          : prev.expertise.filter(e => e !== expertiseId)
      }));
    }
  };

  const validateTeamNumber = (teamNumber: string) => {
    const num = parseInt(teamNumber);
    return !isNaN(num) && num >= 1 && num <= 9999;
  };

  const checkTeamNumberExists = async (teamNumber: string) => {
    const { data, error } = await supabase
      .rpc('check_team_exists_by_number', { p_team_number: parseInt(teamNumber) });
    
    if (error) {
      console.error('Error checking team number:', error);
      return false;
    }
    
    return data;
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Validate team number
      if (!validateTeamNumber(createForm.teamNumber)) {
        toast({
          title: 'Invalid Team Number',
          description: 'Team number must be between 1 and 9999.',
          variant: 'destructive'
        });
        return;
      }

      // Check if team number already exists
      const teamExists = await checkTeamNumberExists(createForm.teamNumber);
      if (teamExists) {
        toast({
          title: 'Team Already Exists',
          description: `Team ${createForm.teamNumber} is already registered in the app.`,
          variant: 'destructive'
        });
        return;
      }

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          team_number: parseInt(createForm.teamNumber),
          name: createForm.teamName,
          first_region: createForm.firstRegion,
          description: createForm.description
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Update user profile with team and expertise
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          team_id: team.id,
          role: 'admin',
          expertise: createForm.expertise as ("outreach" | "mechanical" | "electrical" | "programming" | "business" | "media" | "strategy")[]
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: 'Team Created Successfully',
        description: `Team ${createForm.teamNumber} - ${createForm.teamName} has been created!`
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error Creating Team',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Find team by invite code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('invite_code', joinForm.inviteCode.trim())
        .single();

      if (teamError || !team) {
        toast({
          title: 'Invalid Invite Code',
          description: 'The invite code you entered is not valid.',
          variant: 'destructive'
        });
        return;
      }

      // Update user profile with team and expertise
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          team_id: team.id,
          expertise: joinForm.expertise as ("outreach" | "mechanical" | "electrical" | "programming" | "business" | "media" | "strategy")[]
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: 'Successfully Joined Team',
        description: `Welcome to ${team.name}!`
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error joining team:', error);
      toast({
        title: 'Error Joining Team',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-first-blue">
            Join the FIRST Community
          </CardTitle>
          <CardDescription>
            Set up your team profile to get started with FIRST Tracker
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Team
              </TabsTrigger>
              <TabsTrigger value="join" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Join Team
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6 mt-6">
              <form onSubmit={handleCreateTeam} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamNumber">FRC Team Number *</Label>
                    <Input
                      id="teamNumber"
                      type="number"
                      min="1"
                      max="9999"
                      value={createForm.teamNumber}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, teamNumber: e.target.value }))}
                      placeholder="1234"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstRegion">FIRST Region *</Label>
                    <Select value={createForm.firstRegion} onValueChange={(value) => setCreateForm(prev => ({ ...prev, firstRegion: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your region" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIRST_REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name *</Label>
                  <Input
                    id="teamName"
                    value={createForm.teamName}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, teamName: e.target.value }))}
                    placeholder="Enter your team name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Team Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tell other teams about your mission, values, and what makes your team special..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Your Expertise Areas *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {EXPERTISE_OPTIONS.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${option.id}`}
                          checked={createForm.expertise.includes(option.id)}
                          onCheckedChange={(checked) => handleExpertiseChange(option.id, !!checked, true)}
                        />
                        <Label htmlFor={`create-${option.id}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !createForm.teamNumber || !createForm.teamName || !createForm.firstRegion || createForm.expertise.length === 0}
                >
                  {loading ? 'Creating Team...' : 'Create Team'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="space-y-6 mt-6">
              <form onSubmit={handleJoinTeam} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Team Invite Code *</Label>
                  <Input
                    id="inviteCode"
                    value={joinForm.inviteCode}
                    onChange={(e) => setJoinForm(prev => ({ ...prev, inviteCode: e.target.value }))}
                    placeholder="Enter the invite code provided by your team"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Ask your team admin for the invite code to join your team.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label>Your Expertise Areas *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {EXPERTISE_OPTIONS.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`join-${option.id}`}
                          checked={joinForm.expertise.includes(option.id)}
                          onCheckedChange={(checked) => handleExpertiseChange(option.id, !!checked, false)}
                        />
                        <Label htmlFor={`join-${option.id}`} className="text-sm">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !joinForm.inviteCode.trim() || joinForm.expertise.length === 0}
                >
                  {loading ? 'Joining Team...' : 'Join Team'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}