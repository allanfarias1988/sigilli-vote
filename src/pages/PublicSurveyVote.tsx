import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SurveyItem {
  id: string;
  cargo_nome: string;
  max_sugestoes: number;
  ordem: number;
}

interface Member {
  id: string;
  nome_completo: string;
}

export default function PublicSurveyVote() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [survey, setSurvey] = useState<any>(null);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [votes, setVotes] = useState<{ [key: string]: string[] }>({});

  useEffect(() => {
    loadSurvey();
  }, [code]);

  const loadSurvey = async () => {
    try {
      const { data: surveyData, error: surveyError } = await db
        .from('surveys')
        .select('*')
        .eq('link_code', code)
        .single();

      if (surveyError) throw surveyError;

      if (surveyData.status !== 'aberta') {
        toast({
          title: 'Pesquisa fechada',
          description: 'Esta pesquisa não está mais aceitando votos',
          variant: 'destructive'
        });
        return;
      }

      setSurvey(surveyData);

      const { data: itemsData, error: itemsError } = await db
        .from('survey_items')
        .select('*')
        .eq('survey_id', surveyData.id)
        .order('ordem');

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      const { data: membersData, error: membersError } = await db
        .from('members')
        .select('id, nome_completo')
        .eq('tenant_id', surveyData.tenant_id)
        .eq('apto', true)
        .order('nome_completo');

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Initialize votes object
      const initialVotes: { [key: string]: string[] } = {};
      itemsData?.forEach((item: SurveyItem) => {
        initialVotes[item.cargo_nome] = [];
      });
      setVotes(initialVotes);
    } catch (error) {
      console.error('Error loading survey:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a pesquisa',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVoteChange = (cargo: string, memberId: string, index: number) => {
    setVotes(prev => {
      const cargoVotes = [...(prev[cargo] || [])];
      cargoVotes[index] = memberId;
      return { ...prev, [cargo]: cargoVotes };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      const voteRecords = Object.entries(votes).flatMap(([cargo, memberIds]) =>
        memberIds.filter(id => id).map(memberId => ({
          survey_id: survey.id,
          cargo_nome: cargo,
          member_id: memberId,
          vote_count: 1
        }))
      );

      if (voteRecords.length === 0) {
        toast({
          title: 'Atenção',
          description: 'Você precisa fazer pelo menos uma sugestão',
          variant: 'destructive'
        });
        setSubmitting(false);
        return;
      }

      const { error } = await db
        .from('survey_votes')
        .insert(voteRecords);

      if (error) throw error;

      setSubmitted(true);
      toast({ title: 'Sugestões enviadas com sucesso!' });
    } catch (error) {
      console.error('Error submitting votes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar suas sugestões',
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

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Pesquisa não encontrada</CardTitle>
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
            <CardTitle>Sugestões Enviadas!</CardTitle>
            <CardDescription>
              Obrigado por participar da pesquisa "{survey.titulo}"
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>{survey.titulo}</CardTitle>
            <CardDescription>{survey.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="space-y-3">
                <h3 className="font-semibold">{item.cargo_nome}</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione até {item.max_sugestoes} sugestões
                </p>
                {Array.from({ length: item.max_sugestoes }).map((_, index) => (
                  <Select
                    key={index}
                    value={votes[item.cargo_nome]?.[index] || ''}
                    onValueChange={(value) => handleVoteChange(item.cargo_nome, value, index)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Sugestão ${index + 1}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ))}
              </div>
            ))}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Sugestões
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
