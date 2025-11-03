import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Member {
  id: string;
  nome_completo: string;
  apelido?: string;
  email?: string;
  telefone?: string;
  data_nasc?: string;
  ano_batismo?: number;
  apto: boolean;
}

export default function Members() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    nome_completo: '',
    apelido: '',
    email: '',
    telefone: '',
    data_nasc: '',
    ano_batismo: '',
    apto: true
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
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

      const { data: membersData, error } = await db
        .from('members')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('nome_completo');

      if (error) throw error;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os membros',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      const memberData = {
        tenant_id: tenantId,
        nome_completo: formData.nome_completo,
        apelido: formData.apelido || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        data_nasc: formData.data_nasc || null,
        ano_batismo: formData.ano_batismo ? parseInt(formData.ano_batismo) : null,
        apto: formData.apto
      };

      if (editingMember) {
        const { error } = await db
          .from('members')
          .update(memberData)
          .eq('id', editingMember.id);

        if (error) throw error;
        toast({ title: 'Membro atualizado com sucesso!' });
      } else {
        const { error } = await db
          .from('members')
          .insert(memberData);

        if (error) throw error;
        toast({ title: 'Membro adicionado com sucesso!' });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o membro',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      nome_completo: member.nome_completo,
      apelido: member.apelido || '',
      email: member.email || '',
      telefone: member.telefone || '',
      data_nasc: member.data_nasc || '',
      ano_batismo: member.ano_batismo?.toString() || '',
      apto: member.apto
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;

    try {
      const { error } = await db
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Membro excluído com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o membro',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: '',
      apelido: '',
      email: '',
      telefone: '',
      data_nasc: '',
      ano_batismo: '',
      apto: true
    });
    setEditingMember(null);
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
            <h1 className="text-2xl font-bold">Membros</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMember ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome_completo">Nome Completo *</Label>
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="apelido">Apelido</Label>
                  <Input
                    id="apelido"
                    value={formData.apelido}
                    onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="data_nasc">Data de Nascimento</Label>
                  <Input
                    id="data_nasc"
                    type="date"
                    value={formData.data_nasc}
                    onChange={(e) => setFormData({ ...formData, data_nasc: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="ano_batismo">Ano de Batismo</Label>
                  <Input
                    id="ano_batismo"
                    type="number"
                    value={formData.ano_batismo}
                    onChange={(e) => setFormData({ ...formData, ano_batismo: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingMember ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card key={member.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{member.nome_completo}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(member)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(member.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {member.apelido && <p className="text-sm text-muted-foreground">Apelido: {member.apelido}</p>}
                {member.email && <p className="text-sm">{member.email}</p>}
                {member.telefone && <p className="text-sm">{member.telefone}</p>}
                {member.ano_batismo && <p className="text-sm">Batismo: {member.ano_batismo}</p>}
                <p className="text-sm mt-2">
                  Status: <span className={member.apto ? 'text-green-600' : 'text-red-600'}>
                    {member.apto ? 'Apto' : 'Não Apto'}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum membro cadastrado ainda.</p>
          </div>
        )}
      </main>
    </div>
  );
}
