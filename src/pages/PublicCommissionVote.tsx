// src/pages/PublicCommissionVote.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Interfaces alinhadas com o schema local
interface Commission {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  tenant_id: string;
}

interface CommissionRole {
  id: string;
  nome_cargo: string;
  max_selecoes: number;
}

interface Member {
  id: string;
  nome_completo: string;
}

export default function PublicCommissionVote() {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [votes, setVotes] = useState<{ [roleId: string]: string[] }>({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (code) {
      loadCommission();
    }
  }, [code]);

  useEffect(() => {
    // Filtra membros baseado no termo de busca
    if (searchTerm === "") {
      setFilteredMembers(members);
    } else {
      setFilteredMembers(
        members.filter((member) =>
          member.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }
  }, [searchTerm, members]);

  const loadCommission = async () => {
    try {
      const { data: commissionData, error: commissionError } = await db
        .from("commissions")
        .select("*")
        .eq("link_code", code)
        .single();

      if (commissionError) throw commissionError;
      if (!commissionData) {
        setLoading(false);
        return;
      }

      if (commissionData.status === "closed") {
        toast({
          title: "Votação encerrada",
          description: "Esta comissão não está mais aceitando votos.",
          variant: "destructive",
        });
        setCommission(commissionData as Commission); // Ainda define a comissão para exibir o nome
        setLoading(false);
        return;
      }
      setCommission(commissionData as Commission);

      const { data: rolesData, error: rolesError } = await db
        .from("commission_roles")
        .select("*")
        .eq("commission_id", commissionData.id)
        .eq("ativo", true);

      if (rolesError) throw rolesError;
      const activeRoles = rolesData || [];
      setRoles(activeRoles);

      const { data: membersData, error: membersError } = await db
        .from("members")
        .select("id, nome_completo")
        .eq("tenant_id", commissionData.tenant_id)
        .eq("apto", true);

      if (membersError) throw membersError;
      setMembers(membersData || []);
      setFilteredMembers(membersData || []);

      const initialVotes: { [roleId: string]: string[] } = {};
      activeRoles.forEach((role: CommissionRole) => {
        initialVotes[role.id] = [];
      });
      setVotes(initialVotes);
    } catch (error) {
      console.error("Error loading commission:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a votação. Verifique o código.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoteToggle = (roleId: string, memberId: string) => {
    setVotes((prev) => {
      const roleVotes = prev[roleId] || [];
      const role = roles.find((r) => r.id === roleId);
      const maxSelections = role?.max_selecoes || 1;

      if (roleVotes.includes(memberId)) {
        return { ...prev, [roleId]: roleVotes.filter((id) => id !== memberId) };
      }

      if (roleVotes.length < maxSelections) {
        return { ...prev, [roleId]: [...roleVotes, memberId] };
      }

      toast({
        title: "Limite atingido",
        description: `Você pode selecionar no máximo ${maxSelections} ${maxSelections === 1 ? "pessoa" : "pessoas"} para este cargo.`,
        variant: "destructive",
      });
      return prev;
    });
  };

  const handleSubmit = async () => {
    if (!commission) return;
    setSubmitting(true);

    try {
      const signatureHash = `ballot-${Date.now()}-${Math.random().toString(36)}`;

      const ballotsToInsert = Object.entries(votes)
        .filter(([, memberIds]) => memberIds.length > 0)
        .map(([roleId]) => ({
          commission_id: commission.id,
          role_id: roleId,
          signature_hash: signatureHash,
          voter_id: null, // Voto anônimo
        }));

      if (ballotsToInsert.length === 0) {
        toast({
          title: "Atenção",
          description: "Você precisa votar em pelo menos um cargo.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // CORREÇÃO: .insert().select() para obter os IDs dos ballots criados
      const { data: insertedBallots, error: ballotError } = await db
        .from("ballots")
        .insert(ballotsToInsert)
        .select(); // Retorna os ballots com IDs

      if (ballotError) throw ballotError;
      if (!insertedBallots)
        throw new Error("Falha ao criar as cédulas (ballots).");

      const votesToInsert = insertedBallots.flatMap((ballot: any) => {
        const memberIds = votes[ballot.role_id] || [];
        return memberIds.map((memberId) => ({
          ballot_id: ballot.id,
          member_id: memberId,
        }));
      });

      if (votesToInsert.length > 0) {
        const { error: votesError } = await db
          .from("votes")
          .insert(votesToInsert);
        if (votesError) throw votesError;
      }

      setSubmitted(true);
      toast({ title: "Voto registrado com sucesso!" });
    } catch (error) {
      console.error("Error submitting votes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar seu voto.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Votação não encontrada</CardTitle>
            <CardDescription>
              Verifique o código e tente novamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted || commission.status === "finalizada") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>
              {commission.status === "finalizada"
                ? "Votação Encerrada"
                : "Voto Registrado!"}
            </CardTitle>
            <CardDescription>
              Obrigado por sua participação na comissão "{commission.nome}".
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>{commission.nome}</CardTitle>
            {commission.descricao && (
              <CardDescription>{commission.descricao}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="p-2">
              <Label htmlFor="search-member">Buscar Membro</Label>
              <Input
                id="search-member"
                placeholder="Digite o nome para filtrar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {roles.map((role) => (
              <div key={role.id} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-semibold text-lg">{role.nome_cargo}</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione até {role.max_selecoes}{" "}
                    {role.max_selecoes === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleVoteToggle(role.id, member.id)}
                    >
                      <Checkbox
                        id={`${role.id}-${member.id}`}
                        checked={votes[role.id]?.includes(member.id) || false}
                        onCheckedChange={() =>
                          handleVoteToggle(role.id, member.id)
                        }
                      />
                      <Label
                        htmlFor={`${role.id}-${member.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        {member.nome_completo}
                      </Label>
                    </div>
                  ))}
                </div>
                {filteredMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Nenhum membro encontrado com este nome.
                  </p>
                )}
              </div>
            ))}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Voto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
