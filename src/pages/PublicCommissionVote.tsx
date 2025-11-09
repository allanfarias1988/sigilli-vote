import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CommissionRole {
  id: string;
  nome_cargo: string;
  max_selecoes: number;
  ordem: number;
}

interface Member {
  id: string;
  nome_completo: string;
  imagem_url?: string;
}

export default function PublicCommissionVote() {
  const { code } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [commission, setCommission] = useState<any>(null);
  const [roles, setRoles] = useState<CommissionRole[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [votes, setVotes] = useState<{ [roleId: string]: string[] }>({});

  useEffect(() => {
    loadCommission();
  }, [code]);

  const loadCommission = async () => {
    try {
      const { data: commissionData, error: commissionError } = await db
        .from('commissions')
        .select('*')
        .eq('link_code', code)
        .single();

      if (commissionError) throw commissionError;

      if (commissionData.status === 'finalizada') {
        toast({
          title: 'Votação encerrada',
          description: 'Esta comissão não está mais aceitando votos',
          variant: 'destructive'
        });
        return;
      }

      setCommission(commissionData);

      const { data: rolesData, error: rolesError } = await db
        .from('commission_roles')
        .select('*')
        .eq('commission_id', commissionData.id)
        .eq('ativo', true)
        .order('ordem');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);

      const { data: membersData, error: membersError } = await db
        .from('members')
        .select('id, nome_completo, imagem_url')
        .eq('tenant_id', commissionData.tenant_id)
        .eq('apto', true)
        .order('nome_completo');

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Initialize votes object
      const initialVotes: { [roleId: string]: string[] } = {};
      rolesData?.forEach((role: CommissionRole) => {
        initialVotes[role.id] = [];
      });
      setVotes(initialVotes);
    } catch (error) {
      console.error('Error loading commission:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a votação',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoteToggle = (roleId: string, memberId: string) => {
    setVotes(prev => {
      const roleVotes = prev[roleId] || [];
      const role = roles.find(r => r.id === roleId);
      const maxSelections = role?.max_selecoes || 1;

      if (roleVotes.includes(memberId)) {
        // Remove vote
        return { ...prev, [roleId]: roleVotes.filter(id => id !== memberId) };
      } else {
        // Add vote if under limit
        if (roleVotes.length < maxSelections) {
          return { ...prev, [roleId]: [...roleVotes, memberId] };
        } else {
          toast({
            title: 'Limite atingido',
            description: `Você pode selecionar no máximo ${maxSelections} pessoas para este cargo`,
            variant: 'destructive'
          });
          return prev;
        }
      }
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // Generate a unique ballot signature
      const signatureHash = `ballot-${Date.now()}-${Math.random().toString(36)}`;

      // Create ballots for each role with votes
      const ballotsToInsert = Object.entries(votes)
        .filter(([_, memberIds]) => memberIds.length > 0)
        .map(([roleId]) => ({
          commission_id: commission.id,
          role_id: roleId,
          signature_hash: signatureHash
        }));

      if (ballotsToInsert.length === 0) {
        toast({
          title: 'Atenção',
          description: 'Você precisa votar em pelo menos um cargo',
          variant: 'destructive'
        });
        setSubmitting(false);
        return;
      }

      // Insert ballots
      const { data: insertedBallots, error: ballotError } = await db
        .from('ballots')
        .insert(ballotsToInsert)
        .select();

      if (ballotError) throw ballotError;

      // Create votes for each ballot
      const votesToInsert = insertedBallots?.flatMap((ballot: any) => {
        const roleId = ballot.role_id;
        const memberIds = votes[roleId] || [];
        return memberIds.map(memberId => ({
          ballot_id: ballot.id,
          member_id: memberId
        }));
      });

      const { error: votesError } = await db
        .from('votes')
        .insert(votesToInsert);

      if (votesError) throw votesError;

      setSubmitted(true);
      toast({ title: 'Voto registrado com sucesso!' });
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar seu voto',
        variant: 'destructive'
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Votação não encontrada</CardTitle>
            <CardDescription>Verifique o código e tente novamente</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>Voto Registrado!</CardTitle>
            <CardDescription>
              Obrigado por participar da votação "{commission.nome}"
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
            <CardDescription>{commission.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {roles.map((role) => (
              <div key={role.id} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="font-semibold text-lg">{role.nome_cargo}</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione até {role.max_selecoes} {role.max_selecoes === 1 ? 'pessoa' : 'pessoas'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleVoteToggle(role.id, member.id)}
                    >
                      <Checkbox
                        id={`${role.id}-${member.id}`}
                        checked={votes[role.id]?.includes(member.id) || false}
                        onCheckedChange={() => handleVoteToggle(role.id, member.id)}
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
