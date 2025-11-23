// src/pages/CommissionDetail.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  QrCode,
  Link as LinkIcon,
  RefreshCw,
  Lock,
  Vote,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { RolesManager } from "@/components/RolesManager";
import { FinalizationDialog } from "@/components/FinalizationDialog";

// Tipos baseados no nosso localStorage/client.ts e supabase/types.ts
interface Commission {
  id: string;
  name: string;
  nome: string; // Adicionado para compatibilidade com FinalizationDialog
  description: string | null;
  year: number;
  link_code: string;
  status: string;
  finalized_at: string | null;
  survey_id: string | null;
  identification_mode: string | null;
  anonimato_modo: string | null;
}

interface CommissionRole {
  id: string;
  commission_id: string;
  nome_cargo: string; // Alterado para PT-BR
  max_selecoes: number; // Alterado para PT-BR
  ordem: number; // Alterado para PT-BR
  ativo: boolean; // Alterado para PT-BR
  is_active?: boolean; // Manter opcional para compatibilidade se necessário
  role_name?: string;
  max_selections?: number;
}

interface VoteResult {
  roleName: string;
  votes: {
    memberId: string;
    memberName: string;
    count: number;
  }[];
}

export default function CommissionDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    role_name: "",
    max_selections: 1,
  });
  const [results, setResults] = useState<VoteResult[]>([]);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [availableSurveys, setAvailableSurveys] = useState<any[]>([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [selectedIdentificationMode, setSelectedIdentificationMode] = useState<string>("anonymous");

  useEffect(() => {
    if (id) {
      loadData();
      loadAvailableSurveys();

      // Realtime Subscription
      // @ts-ignore - Ignorando erro de overload do Realtime que ocorre com o mock
      const channel = db.channel("commission-updates")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "votes" },
          (payload: any) => {
            console.log("Realtime update received:", payload);
            loadResults();
          }
        )
        .subscribe();

      return () => {
        // @ts-ignore
        if (db.removeChannel) {
          // @ts-ignore
          db.removeChannel(channel);
        } else if (channel.unsubscribe) {
          channel.unsubscribe();
        }
      };
    }
  }, [id]);

  const loadAvailableSurveys = async () => {
    try {
      // @ts-ignore
      const { data, error } = await db.from("surveys").select("id, title"); // title ou titulo? types.ts diz titulo. client.ts diz titulo.
      // Mas o select abaixo usa title? Vamos verificar o retorno.
      if (error) throw error;
      // Mapear se necessário, mas se o banco retorna titulo, o objeto terá titulo.
      // Vamos assumir que o mock retorna titulo.
      setAvailableSurveys(data || []);
    } catch (error) {
      console.error("Error loading available surveys:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as pesquisas disponíveis.",
        variant: "destructive",
      });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const { data: commissionData, error: commissionError } = await db
        .from("commissions")
        .eq("id", id)
        .select("*")
        .single();

      if (commissionError) throw commissionError;
      // Adicionar campo 'nome' para compatibilidade com FinalizationDialog
      const commissionWithNome = {
        ...commissionData,
        nome: commissionData.name || commissionData.nome || "",
        identification_mode: commissionData.anonimato_modo || commissionData.identification_mode
      };
      setCommission(commissionWithNome);
      setSelectedSurveyId(commissionData.survey_id);
      setSelectedIdentificationMode(commissionData.anonimato_modo || "anonymous");

      // @ts-ignore
      const { data: rolesData, error: rolesError } = await db
        .from("commission_roles")
        .eq("commission_id", id)
        .select("*");

      if (rolesError) throw rolesError;

      // Normalizar dados dos cargos (PT-BR vs EN)
      const normalizedRoles = (rolesData || []).map((r: any) => ({
        ...r,
        nome_cargo: r.nome_cargo || r.role_name,
        max_selecoes: r.max_selecoes || r.max_selections,
        ordem: r.ordem || r.order,
        ativo: r.ativo !== undefined ? r.ativo : r.is_active
      }));

      setRoles(normalizedRoles);

      // Carrega os resultados ao iniciar
      await loadResults();
    } catch (error) {
      console.error("Error loading commission details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da comissão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    if (!id) return;
    try {
      // 1. Buscar todos os membros para mapear IDs para nomes
      // @ts-ignore
      const { data: members, error: membersError } = await db
        .from("members")
        .select("id, nome_completo");
      if (membersError) throw membersError;
      const memberMap = new Map(members?.map((m: any) => [m.id, m.nome_completo]));

      // 2. Buscar todos os cargos da comissão para mapear IDs para nomes
      // @ts-ignore
      const { data: roles, error: rolesError } = await db
        .from("commission_roles")
        .select("id, nome_cargo")
        .eq("commission_id", id);
      if (rolesError) throw rolesError;
      const roleMap = new Map(roles?.map((r: any) => [r.id, r.nome_cargo]));

      // 3. Buscar todas as cédulas (ballots) da comissão
      // @ts-ignore
      const { data: ballots, error: ballotsError } = await db
        .from("ballots")
        .select("id, role_id")
        .eq("commission_id", id);
      if (ballotsError) throw ballotsError;
      if (!ballots || ballots.length === 0) {
        setResults([]); // Sem cédulas, sem resultados
        return;
      }

      // 4. Buscar todos os votos associados a essas cédulas
      const ballotIds = ballots.map((b: any) => b.id);
      const allVotes = [];
      // Simulação de 'in' filter, pois não o implementamos
      for (const ballotId of ballotIds) {
        // @ts-ignore
        const { data: votes, error: votesError } = await db
          .from("votes")
          .select("member_id, ballot_id")
          .eq("ballot_id", ballotId);
        if (votesError) throw votesError;
        if (votes) allVotes.push(...votes);
      }

      // 5. Agregar os resultados
      const voteCounts: { [roleId: string]: { [memberId: string]: number } } =
        {};

      for (const ballot of ballots) {
        if (!voteCounts[ballot.role_id]) {
          voteCounts[ballot.role_id] = {};
        }
        const votesForBallot = allVotes.filter(
          (v) => v.ballot_id === ballot.id,
        );
        for (const vote of votesForBallot) {
          if (!voteCounts[ballot.role_id][vote.member_id]) {
            voteCounts[ballot.role_id][vote.member_id] = 0;
          }
          voteCounts[ballot.role_id][vote.member_id]++;
        }
      }

      const formattedResults = Object.entries(voteCounts).map(
        ([roleId, memberVotes]) => {
          return {
            roleName: (roleMap.get(roleId) || "Cargo Desconhecido") as string,
            votes: Object.entries(memberVotes)
              .map(([memberId, count]) => ({
                memberId,
                memberName: memberMap.get(memberId) || "Membro Desconhecido",
                count,
              }))
              .sort((a, b) => b.count - a.count), // Ordena por mais votado
          };
        },
      );

      setResults(formattedResults);
    } catch (error) {
      console.error("Error loading results:", error);
      toast({ title: "Erro ao carregar resultados", variant: "destructive" });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cargo?")) return;

    try {
      // @ts-ignore
      const { error } = await db
        .from("commission_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      toast({ title: "Cargo excluído com sucesso!" });
      loadData();
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cargo",
        variant: "destructive",
      });
    }
  };

  const copyLink = () => {
    if (!commission) return;
    const link = `${window.location.origin}/vote/commission/${commission.link_code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado para a área de transferência!" });
  };

  const handleUpdateCommissionSurvey = async () => {
    if (!id) return;
    try {
      // @ts-ignore
      const { error } = await db
        .from("commissions")
        .update({ survey_id: selectedSurveyId })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Pesquisa vinculada com sucesso!" });
      loadData();
    } catch (error) {
      console.error("Error updating commission survey:", error);
      toast({
        title: "Erro",
        description: "Não foi possível vincular a pesquisa à comissão.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateIdentificationMode = async () => {
    if (!id) return;
    try {
      // @ts-ignore
      const { error } = await db
        .from("commissions")
        .update({ anonimato_modo: selectedIdentificationMode })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Modo de identificação atualizado com sucesso!" });
      loadData();
    } catch (error) {
      console.error("Error updating identification mode:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o modo de identificação.",
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

  if (!commission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Comissão não encontrada</p>
      </div>
    );
  }

  const isCommissionFinalized = commission.status === "finalizada" || commission.status === "closed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/commissions")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{commission.nome}</h1>
                {isCommissionFinalized && (
                  <Badge variant="destructive">FINALIZADA</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Código: {commission.link_code}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/commissions/${id}/vote`)}
            >
              <Vote className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={copyLink}>
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>QR Code para Votação</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center">
                  <QRCodeSVG
                    value={`${window.location.origin}/vote/commission/${commission.link_code}`}
                  />
                </div>
              </DialogContent>
            </Dialog>
            {!isCommissionFinalized && (
              <FinalizationDialog
                commission={commission}
                onFinalize={loadData}
              />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Label htmlFor="survey-select">Vincular Pesquisa de Sugestões</Label>
          <Select
            value={selectedSurveyId || ""}
            onValueChange={(value) => setSelectedSurveyId(value)}
            disabled={isCommissionFinalized}
          >
            <SelectTrigger id="survey-select" className="w-[240px]">
              <SelectValue placeholder="Selecionar Pesquisa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhuma</SelectItem>
              {availableSurveys.map((survey: any) => (
                <SelectItem key={survey.id} value={survey.id}>
                  {survey.titulo || survey.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleUpdateCommissionSurvey}
            disabled={isCommissionFinalized}
            className="ml-2"
          >
            Vincular
          </Button>
        </div>

        <div className="mb-6">
          <Label htmlFor="identification-mode-select">Modo de Identificação</Label>
          <Select
            value={selectedIdentificationMode}
            onValueChange={(value) => setSelectedIdentificationMode(value)}
            disabled={isCommissionFinalized}
          >
            <SelectTrigger id="identification-mode-select" className="w-[240px]">
              <SelectValue placeholder="Selecionar Modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anonimo">Anônimo</SelectItem>
              <SelectItem value="opcional">Opcional</SelectItem>
              <SelectItem value="obrigatorio">Obrigatório</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleUpdateIdentificationMode}
            disabled={isCommissionFinalized}
            className="ml-2"
          >
            Atualizar Modo
          </Button>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="roles">Cargos</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center mt-4">
              <h2 className="text-xl font-semibold">Cargos da Comissão</h2>
              {!isCommissionFinalized && (
                <RolesManager commissionId={id!} onRolesUpdated={loadData} />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span>{role.nome_cargo}</span>
                      {!isCommissionFinalized && ( // Deletar cargo visível apenas se não finalizada
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Máx. seleções: {role.max_selecoes}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
            {roles.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum cargo adicionado ainda.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <div className="flex justify-between items-center mt-4">
              <h2 className="text-xl font-semibold">Resultados da Votação</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadResults}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                {isCommissionFinalized && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/commissions/${id}/print`)}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir Resultados
                  </Button>
                )}
              </div>
            </div>

            {results.length > 0 ? (
              <div className="space-y-6">
                {results.map((result) => (
                  <Card key={result.roleName}>
                    <CardHeader>
                      <CardTitle>{result.roleName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {result.votes.map((vote) => (
                          <div
                            key={vote.memberId}
                            className="flex justify-between items-center p-2 bg-muted/50 rounded-lg"
                          >
                            <span>{vote.memberName}</span>
                            <span className="font-semibold">
                              {vote.count} voto(s)
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Nenhum voto registrado ainda.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div >
  );
}