// src/pages/Surveys.tsx
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

// Interface alinhada com o schema do localStorage/client.ts
interface Survey {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: "aberta" | "fechada";
  link_code: string;
  created_at: string;
  tenant_id: string;
  ano: number;
}

export default function Surveys() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estado do formulário alinhado com a interface Survey
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    // Simulação para obter tenant_id no modo local
    const localTenantId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
    setTenantId(localTenantId);
    loadData(localTenantId);
  }, []);

  const loadData = async (tenantId: string) => {
    setLoading(true);
    try {
      // CORREÇÃO: Ordem da query
      const { data: surveysData, error } = await db
        .from("surveys")
        .select("*")
        .eq("tenant_id", tenantId);
      // .order('created_at', { ascending: false }); // .order() a ser implementado

      if (error) throw error;
      setSurveys(surveysData || []);
    } catch (error) {
      console.error("Error loading surveys:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as pesquisas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateLinkCode = () => {
    return `SURV${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      const { error } = await db.from("surveys").insert({
        tenant_id: tenantId,
        titulo: formData.title,
        descricao: formData.description || null,
        link_code: generateLinkCode(),
        status: "aberta",
        ano: new Date().getFullYear()
      });

      if (error) throw error;

      toast({ title: "Pesquisa criada com sucesso!" });
      setIsDialogOpen(false);
      setFormData({ title: "", description: "" });
      loadData(tenantId);
    } catch (error) {
      console.error("Error creating survey:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a pesquisa",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (survey: Survey) => {
    if (!tenantId) return;
    try {
      const newStatus = survey.status === "aberta" ? "fechada" : "aberta";
      // CORREÇÃO: Ordem da query
      const { error } = await db
        .from("surveys")
        .update({ status: newStatus })
        .eq("id", survey.id);

      if (error) throw error;

      toast({
        title: `Pesquisa ${newStatus === "aberta" ? "reaberta" : "fechada"} com sucesso!`,
      });
      loadData(tenantId);
    } catch (error) {
      console.error("Error updating survey status:", error);
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
                <DialogTitle>Nova Pesquisa de Sugestões</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
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
                <CardDescription>Código: {survey.link_code}</CardDescription>
              </CardHeader>
              <CardContent>
                {survey.descricao && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {survey.descricao}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      survey.status === "aberta"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {survey.status === "aberta" ? "Aberta" : "Fechada"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(survey);
                    }}
                  >
                    {survey.status === "aberta" ? "Fechar" : "Reabrir"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {surveys.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhuma pesquisa criada ainda.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
