import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, FileText, Vote, BarChart3, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StorageModeIndicator } from '@/components/StorageModeIndicator';

export default function Dashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      loadUserData();
    }
  }, [user, authLoading, navigate]);

  const loadUserData = async () => {
    try {
      const { data: profileData } = await db
        .from('profiles')
        .select('*, tenants(*)')
        .eq('id', user!.id)
        .single();

      if (!profileData) {
        // No profile exists, redirect to onboarding
        navigate('/onboarding');
        return;
      }

      setProfile(profileData);
      setTenant(profileData.tenants);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Membros',
      description: 'Gerenciar membros da igreja',
      icon: Users,
      action: () => navigate('/members')
    },
    {
      title: 'Pesquisas',
      description: 'Criar pesquisas de sugestões',
      icon: FileText,
      action: () => navigate('/surveys')
    },
    {
      title: 'Comissões',
      description: 'Gerenciar comissões de nomeação',
      icon: Vote,
      action: () => navigate('/commissions')
    },
    {
      title: 'Relatórios',
      description: 'Visualizar resultados',
      icon: BarChart3,
      action: () => navigate('/reports')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">SIGNA</h1>
            {tenant && <p className="text-sm text-muted-foreground">{tenant.nome}</p>}
          </div>
          <div className="flex items-center gap-4">
            <StorageModeIndicator />
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Bem-vindo, {profile?.nome}!</h2>
          <p className="text-muted-foreground">
            Gerencie suas comissões de nomeação com transparência e segurança
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={action.action}
            >
              <CardHeader>
                <action.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
