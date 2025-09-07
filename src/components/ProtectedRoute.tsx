import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTeamStatus } from '@/hooks/useTeamStatus';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { hasTeam, loading: teamLoading } = useTeamStatus();
  const navigate = useNavigate();
  
  const loading = authLoading || teamLoading;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!loading && user && !hasTeam) {
      navigate('/team-setup');
    }
  }, [user, authLoading, hasTeam, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-first-blue mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;