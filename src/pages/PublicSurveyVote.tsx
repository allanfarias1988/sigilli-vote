// src/pages/PublicSurveyVote.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Interfaces alinhadas com o schema do localStorage/client.ts
interface Survey {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: "aberta" | "fechada";
  tenant_id: string;
}

interface SurveyItem {
  id: string;
  cargo_nome: string;
  max_sugestoes: number;
  ordem?: number;
}

interface Member {
  id: string;
  nome_completo: string;
}

export default function PublicSurveyVote() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<{
    [itemId: string]: string[];
  }>({});

  useEffect(() => {
    if (code) {
      loadSurvey();
    }
  }, [code]);

  const loadSurvey = async () => {
    try {
      const { data: surveyData, error: surveyError } = await db
        .from("surveys")
        .select("*")
        .eq("link_code", code)
        .single();

      if (surveyError) throw surveyError;
      if (!surveyData) {
        setLoading(false);
        return;
      }

      if (surveyData.status !== "aberta") {
        toast({
          title: "Pesquisa fechada",
          description: "Esta pesquisa não está mais aceitando sugestões.",
          variant: "destructive",
        });
        setSurvey(surveyData as Survey);
        setLoading(false);
        return;
      }

      setSurvey(surveyData as Survey);

      const { data: itemsData, error: itemsError } = await db
        .from("survey_items")
        .select("*")
        .eq("survey_id", surveyData.id);

      if (itemsError) throw itemsError;
      const surveyItems = (itemsData || []).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      setItems(surveyItems);

      const { data: membersData, error: membersError } = await db
        .from("members")
        .select("id, nome_completo")
        .eq("tenant_id", surveyData.tenant_id)
        .eq("apto", true);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Inicializa o objeto de sugestões
      const initialSuggestions: { [itemId: string]: string[] } = {};
      surveyItems.forEach((item: SurveyItem) => {
        initialSuggestions[item.id] = Array(item.max_sugestoes).fill("");
      });
      setSuggestions(initialSuggestions);
    } catch (error) {
      console.error("Error loading survey:", error);
      toast({
        title: "Erro",
        description:
          "Não foi possível carregar a pesquisa. Verifique o código.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionChange = (
    itemId: string,
    memberId: string,
    index: number,
  ) => {
    setSuggestions((prev) => {
      const itemSuggestions = [...(prev[itemId] || [])];
      itemSuggestions[index] = memberId;
      return { ...prev, [itemId]: itemSuggestions };
    });
  };

  const handleSubmit = async () => {
    if (!survey) return;
    setSubmitting(true);

    try {
      const votesToInsert = Object.entries(suggestions)
        .map(([itemId, memberIds]) => {
          const item = items.find((i) => i.id === itemId);
          const validSuggestions = memberIds.filter((id) => id); // Remove empty strings

          if (!item || validSuggestions.length === 0) {
            return null;
          }

          return {
            survey_id: survey.id,
            cargo_nome: item.cargo_nome,
            member_id: validSuggestions[0] || null,
            vote_count: 1,
          };
        })
        .filter((vote): vote is NonNullable<typeof vote> => vote !== null);

      if (votesToInsert.length === 0) {
        toast({
          title: "Atenção",
          description: "Você precisa fazer pelo menos uma sugestão válida.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { error } = await db.from("survey_votes").insert(votesToInsert);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Sugestões enviadas com sucesso!",
        description: "Obrigado por sua participação.",
      });
    } catch (error) {
      console.error("Error submitting suggestions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar suas sugestões.",
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

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Pesquisa não encontrada</CardTitle>
            <CardDescription>
              Verifique o código e tente novamente.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted || survey.status === "fechada") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>
              {survey.status === "fechada"
                ? "Pesquisa Encerrada"
                : "Sugestões Enviadas!"}
            </CardTitle>
            <CardDescription>
              Obrigado por sua participação na pesquisa "{survey.titulo}".
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
            {survey.descricao && (
              <CardDescription>{survey.descricao}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="space-y-3">
                <Label className="font-semibold text-lg">
                  {item.cargo_nome}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Selecione até {item.max_sugestoes} sugestões
                </p>
                {Array.from({ length: item.max_sugestoes }).map(
                  (_, index) => (
                    <Select
                      key={index}
                      value={suggestions[item.id]?.[index] || ""}
                      onValueChange={(value) =>
                        handleSuggestionChange(item.id, value, index)
                      }
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
                  ),
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
              Enviar Sugestões
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
