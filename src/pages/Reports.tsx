import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalSurveys: 0,
    totalCommissions: 0,
    activeSurveys: 0,
    activeCommissions: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const { data: profile } = await db
        .from('profiles')
        .select('tenant_id')
        .eq('id', user!.id)
        .single();

      if (!profile) {
        navigate('/onboarding');
        return;
      }

      const [
        { count: membersCount },
        { count: surveysCount },
        { count: commissionsCount },
        { count: activeSurveysCount },
        { count: activeCommissionsCount }
      ] = await Promise.all([
        db.from('members').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id),
        db.from('surveys').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id),
        db.from('commissions').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id),
        db.from('surveys').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id).eq('status', 'aberta'),
        db.from('commissions').select('*', { count: 'exact', head: true }).eq('tenant_id', profile.tenant_id).eq('status', 'aberta')
      ]);

      setStats({
        totalMembers: membersCount || 0,
        totalSurveys: surveysCount || 0,
        totalCommissions: commissionsCount || 0,
        activeSurveys: activeSurveysCount || 0,
        activeCommissions: activeCommissionsCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Relatórios</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Membros
              </CardTitle>
              <CardDescription>Total de membros cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.totalMembers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Pesquisas
              </CardTitle>
              <CardDescription>Total de pesquisas criadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.totalSurveys}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.activeSurveys} abertas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Comissões
              </CardTitle>
              <CardDescription>Total de comissões criadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{stats.totalCommissions}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {stats.activeCommissions} ativas
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>
                Resumo das atividades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Use esta área para visualizar relatórios detalhados de votações,
                participação em pesquisas e resultados de comissões.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
