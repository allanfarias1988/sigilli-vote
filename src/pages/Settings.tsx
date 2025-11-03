import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  });
  const [tenantForm, setTenantForm] = useState({
    nome: '',
    ano_corrente: new Date().getFullYear()
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
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, tenants(*)')
        .eq('id', user!.id)
        .single();

      if (!profileData) {
        navigate('/onboarding');
        return;
      }

      setProfile(profileData);
      setTenant(profileData.tenants);
      setProfileForm({
        nome: profileData.nome || '',
        email: profileData.email || '',
        telefone: profileData.telefone || ''
      });
      setTenantForm({
        nome: profileData.tenants?.nome || '',
        ano_corrente: profileData.tenants?.ano_corrente || new Date().getFullYear()
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          nome: profileForm.nome,
          email: profileForm.email,
          telefone: profileForm.telefone
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast({ title: 'Perfil atualizado com sucesso!' });
      loadData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          nome: tenantForm.nome,
          ano_corrente: tenantForm.ano_corrente
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({ title: 'Configurações da igreja atualizadas!' });
      loadData();
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar as configurações',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
            <h1 className="text-2xl font-bold">Configurações</h1>
          </div>
          <Button variant="destructive" onClick={signOut}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfil Pessoal</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={profileForm.nome}
                    onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={profileForm.telefone}
                    onChange={(e) => setProfileForm({ ...profileForm, telefone: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Perfil
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações da Igreja</CardTitle>
              <CardDescription>Gerencie as configurações da sua igreja</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveTenant} className="space-y-4">
                <div>
                  <Label htmlFor="igreja_nome">Nome da Igreja</Label>
                  <Input
                    id="igreja_nome"
                    value={tenantForm.nome}
                    onChange={(e) => setTenantForm({ ...tenantForm, nome: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ano_corrente">Ano Corrente</Label>
                  <Input
                    id="ano_corrente"
                    type="number"
                    value={tenantForm.ano_corrente}
                    onChange={(e) => setTenantForm({ ...tenantForm, ano_corrente: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
