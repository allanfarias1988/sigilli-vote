// src/pages/Commissions.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Commission {
  id: string;
  name: string; // Corrigido de 'nome' para 'name' para consistência
  description?: string | null; // Corrigido de 'descricao'
  year: number; // Corrigido de 'ano'
  status: string;
  link_code: string;
  created_at: string;
}

export default function Commissions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    year: new Date().getFullYear(),
    survey_id: null as string | null,
    anonimato_modo: "anonimo" as "anonimo" | "obrigatorio" | "opcional",
  });

  // Carrega os dados iniciais
  useEffect(() => {
    if (user) {
      // Simulação para obter tenant_id no modo local, já que não temos 'profiles'
      const localTenantId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
      setTenantId(localTenantId);
      loadData(localTenantId);
      loadSurveys(localTenantId);
    }
  }, [user]);

  const loadSurveys = async (tenantId: string) => {
    try {
      const { data, error } = await db
        .from("surveys")
        .eq("tenant_id", tenantId)
        .select("id, title, status");
      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error("Error loading surveys:", error);
    }
  };

  const loadData = async (tenantId: string) => {
    if (!tenantId) return;
    setLoading(true);
    try {
      // CORREÇÃO: Ordem da query
      const { data: commissionsData, error } = await db
        .from("commissions")
        .eq("tenant_id", tenantId) // .eq() antes de .select()
        .select("*");
      // .order('created_at', { ascending: false }); // .order() será implementado depois

      if (error) throw error;
      setCommissions(commissionsData || []);
    } catch (error) {
      console.error("Error loading commissions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as comissões",
        variant: "destructive",
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
    if (!tenantId || !user) return;

    try {
      const { error } = await db.from("commissions").insert({
        tenant_id: tenantId,
        created_by: user.id,
        name: formData.name,
        description: formData.description || null,
        year: formData.year,
        survey_id: formData.survey_id,
        anonimato_modo: formData.anonimato_modo,
        link_code: generateLinkCode(),
        status: "draft" as const,
      });

      if (error) throw error;

      toast({ title: "Comissão criada com sucesso!" });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        year: new Date().getFullYear(),
        survey_id: null,
        anonimato_modo: "anonimo",
      });
      loadData(tenantId); // Recarrega os dados
    } catch (error) {
      console.error("Error creating commission:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a comissão",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (
    commission: Commission,
    newStatus: "draft" | "open" | "closed",
  ) => {
    try {
      // CORREÇÃO: Ordem da query
      const { error } = await db
        .from("commissions")
        .eq("id", commission.id) // .eq() antes de .update()
        .update({ status: newStatus });

      if (error) throw error;

      toast({ title: `Status atualizado para ${newStatus}!` });
      if (tenantId) loadData(tenantId);
    } catch (error) {
      console.error("Error updating commission status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Comissões de Nomeação</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Comissão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Comissão</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="survey">Vincular Pesquisa de Sugestões (Opcional)</Label>
                  <Select
                    value={formData.survey_id || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, survey_id: value === "none" ? null : value })
                    }
                  >
                    <SelectTrigger id="survey">
                      <SelectValue placeholder="Selecione uma pesquisa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {surveys.map((survey) => (
                        <SelectItem key={survey.id} value={survey.id}>
                          {survey.title} ({survey.status})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="anonimato">Modo de Anonimato</Label>
                  <Select
                    value={formData.anonimato_modo}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, anonimato_modo: value })
                    }
                  >
                    <SelectTrigger id="anonimato">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anonimo">Anônimo</SelectItem>
                      <SelectItem value="opcional">Identificação Opcional</SelectItem>
                      <SelectItem value="obrigatorio">Identificação Obrigatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Criar Comissão
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {commissions.map((commission) => (
            <Card
              key={commission.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/commissions/${commission.id}`)}
            >
              <CardHeader>
                <CardTitle>{commission.name}</CardTitle>
                <CardDescription>
                  Ano: {commission.year} • Código: {commission.link_code}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {commission.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {commission.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Status: {commission.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {commission.status === "draft" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(commission, "open");
                        }}
                      >
                        Abrir
                      </Button>
                    )}
                    {commission.status === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(commission, "closed");
                        }}
                      >
                        Finalizar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {commissions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma comissão criada ainda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
