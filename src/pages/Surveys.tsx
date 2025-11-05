import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface Survey {
  id: string;
  titulo: string;
  descricao?: string;
  ano: number;
  status: string;
  link_code: string;
  created_at: string;
}

export default function Surveys() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    ano: new Date().getFullYear()
  });

  useEffect(() => {
    // TEMPORARY: Skip auth check for development
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
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

      setTenantId(profile.tenant_id);

      const { data: surveysData, error } = await db
        .from('surveys')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(surveysData || []);
    } catch (error) {
      console.error('Error loading surveys:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as pesquisas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLinkCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      const { error } = await db
        .from('surveys')
        .insert({
          tenant_id: tenantId,
          titulo: formData.titulo,
          descricao: formData.descricao || null,
          ano: formData.ano,
          link_code: generateLinkCode(),
          status: 'aberta'
        });

      if (error) throw error;

      toast({ title: 'Pesquisa criada com sucesso!' });
      setIsDialogOpen(false);
      setFormData({
        titulo: '',
        descricao: '',
        ano: new Date().getFullYear()
      });
      loadData();
    } catch (error) {
      console.error('Error creating survey:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a pesquisa',
        variant: 'destructive'
      });
    }
  };

  const toggleStatus = async (survey: Survey) => {
    try {
      const newStatus = survey.status === 'aberta' ? 'fechada' : 'aberta';
      const { error } = await db
        .from('surveys')
        .update({ status: newStatus })
        .eq('id', survey.id);

      if (error) throw error;

      toast({ title: `Pesquisa ${newStatus === 'aberta' ? 'reaberta' : 'fechada'} com sucesso!` });
      loadData();
    } catch (error) {
      console.error('Error updating survey status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Pesquisas de Sugestões</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Pesquisa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Pesquisa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Criar Pesquisa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <Card
              key={survey.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/surveys/${survey.id}`)}
            >
              <CardHeader>
                <CardTitle>{survey.titulo}</CardTitle>
                <CardDescription>
                  Ano: {survey.ano} • Código: {survey.link_code}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {survey.descricao && (
                  <p className="text-sm text-muted-foreground mb-4">{survey.descricao}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    survey.status === 'aberta' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {survey.status === 'aberta' ? 'Aberta' : 'Fechada'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(survey);
                    }}
                  >
                    {survey.status === 'aberta' ? 'Fechar' : 'Reabrir'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {surveys.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma pesquisa criada ainda.</p>
          </div>
        )}
      </main>
    </div>
  );
}
