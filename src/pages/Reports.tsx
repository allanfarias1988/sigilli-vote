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
import { Loader2, ArrowLeft, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    activeCommissions: 0,
  });

  useEffect(() => {
    // TEMPORARY: Skip auth check for development
    loadStats();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      // Using mock tenant_id directly as there's no real profile in local mode
      const tenantId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";

      const [
        { data: membersData },
        { data: surveysData },
        { data: commissionsData },
      ] = await Promise.all([
        db.from("members").select("id").eq("tenant_id", tenantId),
        db.from("surveys").select("id, status").eq("tenant_id", tenantId),
        db.from("commissions").select("id, status").eq("tenant_id", tenantId),
      ]);

      const totalMembers = membersData?.length || 0;
      const totalSurveys = surveysData?.length || 0;
      const totalCommissions = commissionsData?.length || 0;

      const activeSurveys = (surveysData || []).filter(
        (s) => s.status === "open",
      ).length;
      const activeCommissions = (commissionsData || []).filter(
        (c) => c.status === "open",
      ).length;

      setStats({
        totalMembers,
        totalSurveys,
        totalCommissions,
        activeSurveys,
        activeCommissions,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios",
        variant: "destructive",
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
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
                {stats.activeCommissions} abertas
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
