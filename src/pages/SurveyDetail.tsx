import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Plus, Trash2, QrCode, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SurveyItem {
  id: string;
  cargo_nome: string;
  max_sugestoes: number;
  ordem: number;
}

export default function SurveyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    cargo_nome: '',
    max_sugestoes: 2
  });
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadData();
  }, [user, navigate, id]);

  const loadData = async () => {
    try {
      const { data: surveyData, error: surveyError } = await db
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single();

      if (surveyError) throw surveyError;
      setSurvey(surveyData);

      const { data: itemsData, error: itemsError } = await db
        .from('survey_items')
        .select('*')
        .eq('survey_id', id)
        .order('ordem');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      await loadResults();
    } catch (error) {
      console.error('Error loading survey:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a pesquisa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const { data: votesData } = await db
        .from('survey_votes')
        .select('cargo_nome, member_id, vote_count, members(nome_completo)')
        .eq('survey_id', id);

      if (votesData) {
        const grouped = votesData.reduce((acc: any, vote: any) => {
          if (!acc[vote.cargo_nome]) {
            acc[vote.cargo_nome] = [];
          }
          acc[vote.cargo_nome].push({
            member: vote.members?.nome_completo || 'Desconhecido',
            votes: vote.vote_count
          });
          return acc;
        }, {});

        setResults(Object.entries(grouped).map(([cargo, votes]: [string, any]) => ({
          cargo,
          votes: votes.sort((a: any, b: any) => b.votes - a.votes)
        })));
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await db
        .from('survey_items')
        .insert({
          survey_id: id,
          cargo_nome: formData.cargo_nome,
          max_sugestoes: formData.max_sugestoes,
          ordem: items.length + 1
        });

      if (error) throw error;

      toast({ title: 'Cargo adicionado com sucesso!' });
      setIsDialogOpen(false);
      setFormData({ cargo_nome: '', max_sugestoes: 2 });
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o cargo',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cargo?')) return;

    try {
      const { error } = await db
        .from('survey_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({ title: 'Cargo excluído com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cargo',
        variant: 'destructive'
      });
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/vote/survey/${survey.link_code}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copiado para a área de transferência!' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Pesquisa não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/surveys')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{survey.titulo}</h1>
              <p className="text-sm text-muted-foreground">Código: {survey.link_code}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={copyLink}>
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Cargos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cargos da Pesquisa</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cargo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Cargo</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddItem} className="space-y-4">
                    <div>
                      <Label htmlFor="cargo_nome">Nome do Cargo *</Label>
                      <Input
                        id="cargo_nome"
                        value={formData.cargo_nome}
                        onChange={(e) => setFormData({ ...formData, cargo_nome: e.target.value })}
                        placeholder="Ex: Ancião, Diácono, Tesoureiro..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_sugestoes">Máximo de Sugestões</Label>
                      <Input
                        id="max_sugestoes"
                        type="number"
                        value={formData.max_sugestoes}
                        onChange={(e) => setFormData({ ...formData, max_sugestoes: parseInt(e.target.value) })}
                        min={1}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Adicionar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{item.cargo_nome}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Máximo de sugestões: {item.max_sugestoes}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum cargo adicionado ainda.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <h2 className="text-xl font-semibold">Resultados da Pesquisa</h2>

            {results.length > 0 ? (
              <div className="space-y-6">
                {results.map((result) => (
                  <Card key={result.cargo}>
                    <CardHeader>
                      <CardTitle>{result.cargo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.votes.map((vote: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span>{vote.member}</span>
                            <span className="font-semibold">{vote.votes} votos</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum voto registrado ainda.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
