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

interface CommissionRole {
  id: string;
  nome_cargo: string;
  max_selecoes: number;
  ordem: number;
  ativo: boolean;
}

export default function CommissionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState<any>(null);
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome_cargo: '',
    max_selecoes: 2
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
      const { data: commissionData, error: commissionError } = await db
        .from('commissions')
        .select('*')
        .eq('id', id)
        .single();

      if (commissionError) throw commissionError;
      setCommission(commissionData);

      const { data: rolesData, error: rolesError } = await db
        .from('commission_roles')
        .select('*')
        .eq('commission_id', id)
        .order('ordem');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      await loadResults();
    } catch (error) {
      console.error('Error loading commission:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a comissão',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const { data: ballotsData } = await db
        .from('ballots')
        .select('*, commission_roles(nome_cargo), votes(member_id, members(nome_completo))')
        .eq('commission_id', id);

      if (ballotsData) {
        const grouped = ballotsData.reduce((acc: any, ballot: any) => {
          const role = ballot.commission_roles?.nome_cargo || 'Desconhecido';
          if (!acc[role]) {
            acc[role] = {};
          }
          ballot.votes?.forEach((vote: any) => {
            const member = vote.members?.nome_completo || 'Desconhecido';
            acc[role][member] = (acc[role][member] || 0) + 1;
          });
          return acc;
        }, {});

        setResults(Object.entries(grouped).map(([role, votes]: [string, any]) => ({
          role,
          votes: Object.entries(votes)
            .map(([member, count]) => ({ member, count }))
            .sort((a: any, b: any) => b.count - a.count)
        })));
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await db
        .from('commission_roles')
        .insert({
          commission_id: id,
          nome_cargo: formData.nome_cargo,
          max_selecoes: formData.max_selecoes,
          ordem: roles.length + 1,
          ativo: true
        });

      if (error) throw error;

      toast({ title: 'Cargo adicionado com sucesso!' });
      setIsDialogOpen(false);
      setFormData({ nome_cargo: '', max_selecoes: 2 });
      loadData();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o cargo',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cargo?')) return;

    try {
      const { error } = await db
        .from('commission_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      toast({ title: 'Cargo excluído com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o cargo',
        variant: 'destructive'
      });
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/vote/commission/${commission.link_code}`;
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

  if (!commission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Comissão não encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/commissions')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{commission.nome}</h1>
              <p className="text-sm text-muted-foreground">Código: {commission.link_code}</p>
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
        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles">Cargos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cargos da Comissão</h2>
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
                  <form onSubmit={handleAddRole} className="space-y-4">
                    <div>
                      <Label htmlFor="nome_cargo">Nome do Cargo *</Label>
                      <Input
                        id="nome_cargo"
                        value={formData.nome_cargo}
                        onChange={(e) => setFormData({ ...formData, nome_cargo: e.target.value })}
                        placeholder="Ex: Ancião, Diácono, Tesoureiro..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_selecoes">Máximo de Seleções</Label>
                      <Input
                        id="max_selecoes"
                        type="number"
                        value={formData.max_selecoes}
                        onChange={(e) => setFormData({ ...formData, max_selecoes: parseInt(e.target.value) })}
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
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{role.nome_cargo}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRole(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Máximo de seleções: {role.max_selecoes}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status: {role.ativo ? 'Ativo' : 'Inativo'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {roles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum cargo adicionado ainda.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <h2 className="text-xl font-semibold">Resultados da Votação</h2>

            {results.length > 0 ? (
              <div className="space-y-6">
                {results.map((result) => (
                  <Card key={result.role}>
                    <CardHeader>
                      <CardTitle>{result.role}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.votes.map((vote: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span>{vote.member}</span>
                            <span className="font-semibold">{vote.count} votos</span>
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
