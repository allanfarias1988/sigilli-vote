// src/pages/VotingSession.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { searchMembers } from "@/lib/search-utils";

// Tipos baseados no nosso localStorage/client.ts
interface Commission {
  id: string;
  nome: string;
  descricao: string | null;
  ano: number;
  link_code: string;
  status: string;
  finalized_at: string | null;
  survey_id?: string | null;
}

interface CommissionRole {
  id: string;
  commission_id: string;
  nome_cargo: string; // Alterado para PT-BR
  max_selecoes: number; // Alterado para PT-BR
  ordem: number; // Alterado para PT-BR
  ativo: boolean; // Alterado para PT-BR
  role_name?: string; // Compatibilidade
  max_selections?: number; // Compatibilidade
}

interface Member {
  id: string;
  nome_completo: string;
  apelido?: string;
  voteCount?: number;
}

export default function VotingSession() {
  const { user } = useAuth();
  const { id: commissionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentRoleIndex, setCurrentRoleIndex] = useState(0);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [surveyItems, setSurveyItems] = useState<any[]>([]);
  const [surveyVotes, setSurveyVotes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (commissionId) {
      loadCommissionDetails(commissionId);
      loadRoles(commissionId);
      loadMembers();
    }
  }, [commissionId]);

  // Verificar se comissão está finalizada e redirecionar
  useEffect(() => {
    if (commission && (commission.status === 'finalizada' || commission.status === 'closed')) {
      toast({
        title: 'Comissão Finalizada',
        description: 'Esta comissão já foi finalizada e não aceita mais votos.',
        variant: 'destructive'
      });
      navigate(`/commissions/${commissionId}`);
    }
  }, [commission, commissionId, navigate, toast]);

  useEffect(() => {
    if (commission?.survey_id) {
      loadSurveyData(commission.survey_id);
    }
  }, [commission?.survey_id]);

  const loadSurveyData = async (surveyId: string) => {
    try {
      // @ts-ignore
      const { data: itemsData, error: itemsError } = await db
        .from("survey_items")
        .select("*")
        .eq("survey_id", surveyId);
      if (itemsError) throw itemsError;
      setSurveyItems(itemsData || []);

      // @ts-ignore
      const { data: votesData, error: votesError } = await db
        .from("survey_votes")
        .select("*")
        .eq("survey_id", surveyId);
      if (votesError) throw votesError;
      setSurveyVotes(votesData || []);
    } catch (error) {
      console.error("Error loading survey data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da pesquisa.",
        variant: "destructive",
      });
    }
  };

  const loadCommissionDetails = async (id: string) => {
    setLoading(true);
    try {
      // @ts-ignore
      const { data, error } = await db.from("commissions").select('*').eq("id", id).single();
      if (error) throw error;
      setCommission(data);
    } catch (error) {
      console.error("Error loading commission details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da comissão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async (id: string) => {
    try {
      const { data, error } = await db
        .from("commission_roles")
        .select("*")
        .eq("commission_id", id);

      if (error) throw error;

      // Normalizar dados
      const normalizedRoles = (data || []).map((r: any) => ({
        ...r,
        nome_cargo: r.nome_cargo || r.role_name,
        max_selecoes: r.max_selecoes || r.max_selections,
        ordem: r.ordem || r.order,
        ativo: r.ativo !== undefined ? r.ativo : r.is_active
      }));

      const sortedRoles = normalizedRoles.sort((a: any, b: any) => a.ordem - b.ordem);
      setRoles(sortedRoles);
    } catch (error) {
      console.error("Error loading roles:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cargos da comissão.",
        variant: "destructive",
      });
    }
  };

  const loadMembers = async () => {
    try {
      // @ts-ignore
      const { data, error } = await db.from("members").select("id, nome_completo");
      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os membros.",
        variant: "destructive",
      });
    }
  };

  const handleMemberSelection = (memberId: string) => {
    const currentRole = roles[currentRoleIndex];
    if (!currentRole) return;

    setSelectedMembers((prevSelected) => {
      if (prevSelected.includes(memberId)) {
        return prevSelected.filter((id) => id !== memberId);
      } else {
        if (prevSelected.length < currentRole.max_selecoes) {
          return [...prevSelected, memberId];
        } else {
          toast({
            title: "Limite de seleção atingido",
            description: `Você só pode selecionar até ${currentRole.max_selecoes} membro(s) para este cargo.`,
            variant: "destructive",
          });
          return prevSelected;
        }
      }
    });
  };

  const handleNextRole = async () => {
    const currentRole = roles[currentRoleIndex];
    if (!commissionId || !currentRole || !user) return;

    try {
      // 1. Create a ballot
      // @ts-ignore
      const { data: ballotData, error: ballotError } = await db
        .from("ballots")
        .insert({
          commission_id: commissionId,
          role_id: currentRole.id,
          voter_id: user.id, // Assuming anonymous voting for now
          signature_hash: crypto.randomUUID(), // Placeholder
        })
        .select()
        .single();

      if (ballotError) throw ballotError;

      // 2. Create votes for each selected member
      const votesToInsert = selectedMembers.map((memberId) => ({
        ballot_id: ballotData.id,
        member_id: memberId,
      }));

      if (votesToInsert.length > 0) {
        // @ts-ignore
        const { error: votesError } = await db
          .from("votes")
          .insert(votesToInsert);
        if (votesError) throw votesError;
      }

      toast({
        title: "Votos salvos com sucesso!",
        description: `Votos para ${currentRole.nome_cargo} foram registrados.`,
      });

      // 3. Move to the next role
      setSelectedMembers([]);
      setCurrentRoleIndex(currentRoleIndex + 1);
    } catch (error) {
      console.error("Error saving votes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os votos.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousRole = () => {
    setSelectedMembers([]);
    setCurrentRoleIndex(currentRoleIndex - 1);
  };

  const getRankedMembers = (
    role: CommissionRole,
    allMembers: Member[],
    allSurveyItems: any[],
    allSurveyVotes: any[],
  ) => {
    const correspondingSurveyItem = allSurveyItems.find(
      (item) => item.cargo_nome === role.nome_cargo || item.role_name === role.nome_cargo,
    );

    if (!correspondingSurveyItem) {
      return allMembers.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
    }

    const votesForThisRole = allSurveyVotes.filter(
      (vote) => vote.cargo_nome === correspondingSurveyItem.cargo_nome || vote.role_name === correspondingSurveyItem.cargo_nome,
    );

    const memberVoteCounts: { [memberId: string]: number } = {};
    for (const vote of votesForThisRole) {
      // Se o voto tiver sugestões (array) ou for um voto único (member_id)
      // O mock data usa member_id e vote_count, mas o código original assumia 'suggestions' array?
      // Vamos ajustar para o mock data atual que tem member_id e vote_count
      if (vote.member_id) {
        memberVoteCounts[vote.member_id] = (memberVoteCounts[vote.member_id] || 0) + (vote.vote_count || 1);
      }
      // Fallback para estrutura antiga se existir
      if (vote.suggestions && Array.isArray(vote.suggestions)) {
        for (const suggestedMemberId of vote.suggestions) {
          memberVoteCounts[suggestedMemberId] = (memberVoteCounts[suggestedMemberId] || 0) + 1;
        }
      }
    }

    const rankedMembers = allMembers
      .map((member) => ({
        ...member,
        voteCount: memberVoteCounts[member.id] || 0,
      }))
      .sort((a, b) => {
        if (b.voteCount !== a.voteCount) {
          return (b.voteCount || 0) - (a.voteCount || 0);
        }
        return a.nome_completo.localeCompare(b.nome_completo);
      });

    return rankedMembers;
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-2xl font-bold mb-4">Comissão não encontrada</p>
        <Button onClick={() => navigate("/commissions")}>
          Voltar para Comissões
        </Button>
      </div>
    );
  }

  if (commission?.status === "closed" || commission?.status === "finalizada") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-2xl font-bold mb-4">
          Esta comissão já foi finalizada.
        </p>
        <Button
          onClick={() => navigate(`/commissions/${commissionId}`)}
        >
          Ver Resultados
        </Button>
      </div>
    );
  }

  const currentRole = roles[currentRoleIndex];
  const allRankedMembers = currentRole
    ? getRankedMembers(currentRole, members, surveyItems, surveyVotes)
    : [];

  const filteredRankedMembers = searchTerm.trim()
    ? searchMembers(
      allRankedMembers,
      searchTerm
    ).map(m => allRankedMembers.find(rm => rm.id === m.id)!)
    : allRankedMembers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/commissions/${commissionId}`)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Sessão de Votação</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
         <h2 className="text-3xl font-bold text-center mb-2">
           {commission.nome}
         </h2>
         <p className="text-muted-foreground text-center mb-8">
           {commission.descricao}
         </p>

        {currentRole ? (
          <Card>
            <CardHeader>
              <CardTitle>{currentRole.nome_cargo}</CardTitle>
              <CardDescription>
                Selecione até {currentRole.max_selecoes} nome(s) para este
                cargo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Buscar membros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRankedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => handleMemberSelection(member.id)}
                    />
                    <Label
                      htmlFor={`member-${member.id}`}
                      className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {member.nome_completo}
                    </Label>
                    {member.voteCount && member.voteCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {member.voteCount} {member.voteCount === 1 ? 'sugestão' : 'sugestões'}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center">
            <p className="text-lg">Todos os cargos foram votados.</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            onClick={handlePreviousRole}
            disabled={currentRoleIndex === 0}
          >
            Anterior
          </Button>
          <Button
            onClick={handleNextRole}
            disabled={currentRoleIndex >= roles.length - 1}
          >
            Salvar e Próximo
          </Button>
        </div>
      </main>
    </div>
  );
}
