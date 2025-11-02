import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nomeIgreja: '',
    telefone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create slug from church name
      const slug = form.nomeIgreja
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Create tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          nome: form.nomeIgreja,
          slug
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user!.id,
          tenant_id: tenantData.id,
          nome: user!.user_metadata.nome,
          email: user!.email,
          telefone: form.telefone
        });

      if (profileError) throw profileError;

      // Assign tenant_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user!.id,
          tenant_id: tenantData.id,
          role: 'tenant_admin'
        });

      if (roleError) throw roleError;

      toast({
        title: 'Sucesso!',
        description: 'Igreja configurada com sucesso'
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error during onboarding:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível completar o cadastro',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configure sua Igreja</CardTitle>
          <CardDescription>
            Complete as informações para começar a usar o SIGNA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomeIgreja">Nome da Igreja</Label>
              <Input
                id="nomeIgreja"
                type="text"
                placeholder="Ex: Igreja Adventista Central"
                value={form.nomeIgreja}
                onChange={(e) => setForm({ ...form, nomeIgreja: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
