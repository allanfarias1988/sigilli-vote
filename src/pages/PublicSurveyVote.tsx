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
  title: string;
  description?: string | null;
  status: "open" | "closed";
  tenant_id: string;
}

interface SurveyItem {
  id: string;
  role_name: string;
  max_suggestions: number;
  order?: number; // Adicionado para consistência, se não existir no mock
}

interface Member {
  id: string;
  full_name: string;
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
      // CORREÇÃO: Ordem da query
      const { data: surveyData, error: surveyError } = await db
        .from("surveys")
        .eq("link_code", code)
        .select("*")
        .single();

      if (surveyError) throw surveyError;
      if (!surveyData) {
        setLoading(false);
        return;
      }

      if (surveyData.status !== "open") {
        toast({
          title: "Pesquisa fechada",
          description: "Esta pesquisa não está mais aceitando sugestões.",
          variant: "destructive",
        });
        setSurvey(surveyData as Survey); // Define a pesquisa para exibir o título
        setLoading(false);
        return;
      }

      setSurvey(surveyData as Survey);

      // CORREÇÃO: Ordem da query e nome do campo 'role_name'
      const { data: itemsData, error: itemsError } = await db
        .from("survey_items")
        .eq("survey_id", surveyData.id)
        .select("*");
      // .order('order'); // .order() a ser implementado

      if (itemsError) throw itemsError;
      const surveyItems = (itemsData || []).sort((a, b) => (a.order || 0) - (b.order || 0));
      setItems(surveyItems);

      // CORREÇÃO: Ordem da query e nome do campo 'full_name'
      const { data: membersData, error: membersError } = await db
        .from("members")
        .eq("tenant_id", surveyData.tenant_id)
        .eq("is_active", true)
        .select("id, full_name");

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Inicializa o objeto de sugestões
      const initialSuggestions: { [itemId: string]: string[] } = {};
      surveyItems.forEach((item: SurveyItem) => {
        initialSuggestions[item.id] = Array(item.max_suggestions).fill("");
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
            role_name: item.role_name,
            suggestions: validSuggestions,
            member_id: null, // Anonymous public vote
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

  if (submitted || survey.status === "closed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle>
              {survey.status === "closed"
                ? "Pesquisa Encerrada"
                : "Sugestões Enviadas!"}
            </CardTitle>
            <CardDescription>
              Obrigado por sua participação na pesquisa "{survey.title}".
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
            <CardTitle>{survey.title}</CardTitle>
            {survey.description && (
              <CardDescription>{survey.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {items.map((item) => (
              <div key={item.id} className="space-y-3">
                <Label className="font-semibold text-lg">
                  {item.role_name}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Selecione até {item.max_suggestions} sugestões
                </p>
                {Array.from({ length: item.max_suggestions }).map(
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
                            {member.full_name}
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
