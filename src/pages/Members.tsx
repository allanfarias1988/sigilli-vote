// src/pages/Members.tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
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
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, UserCircle2, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CSVImporter } from "@/components/CSVImporter";

// Interface alinhada com o schema do localStorage/client.ts
// Interface alinhada com o schema do localStorage/client.ts
interface Member {
  id: string;
  nome_completo: string;
  apelido?: string | null;
  email?: string | null;
  telefone?: string | null;
  data_nasc?: string | null;
  ano_batismo?: number | null;
  apto: boolean;
  tenant_id: string;
  imagem_url?: string | null;
  // Campos adicionais do banco
  cargos_atuais?: string[] | null;
  endereco?: string | null;
  estado_civil?: string | null;
  interesses?: string[] | null;
  tempo_no_cargo?: number | null;
  updated_at?: string;
  created_at?: string;
}

export default function Members() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Estado do formulário alinhado com a interface Member
  const [formData, setFormData] = useState({
    nome_completo: "",
    apelido: "",
    email: "",
    telefone: "",
    data_nasc: "",
    ano_batismo: "",
    apto: true,
    imagem_url: "",
  });

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Simulação para obter tenant_id no modo local
    const localTenantId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
    setTenantId(localTenantId);
    loadData(localTenantId);
  }, []);

  const loadData = async (tenantId: string) => {
    setLoading(true);
    try {
      const { data: membersData, error } = await db
        .from("members")
        .select("*")
        .eq("tenant_id", tenantId);

      if (error) throw error;
      const sortedMembers = (membersData || []).sort((a, b) =>
        (a.nome_completo || "").localeCompare(b.nome_completo || "")
      );
      setMembers(sortedMembers);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os membros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    (member) =>
      member.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.apelido &&
        member.apelido.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      const memberData = {
        tenant_id: tenantId,
        nome_completo: formData.nome_completo,
        apelido: formData.apelido || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        data_nasc: formData.data_nasc || null,
        ano_batismo: formData.ano_batismo
          ? parseInt(formData.ano_batismo)
          : null,
        apto: formData.apto,
        imagem_url: formData.imagem_url || null,
      };

      if (editingMember) {
        const { error } = await db
          .from("members")
          .update(memberData)
          .eq("id", editingMember.id);

        if (error) throw error;
        toast({ title: "Membro atualizado com sucesso!" });
      } else {
        const { error } = await db.from('members').insert(memberData);

        if (error) throw error;
        toast({ title: "Membro adicionado com sucesso!" });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData(tenantId);
    } catch (error) {
      console.error("Error saving member:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o membro",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      nome_completo: member.nome_completo,
      apelido: member.apelido || "",
      email: member.email || "",
      telefone: member.telefone || "",
      data_nasc: member.data_nasc || "",
      ano_batismo: member.ano_batismo?.toString() || "",
      apto: member.apto,
      imagem_url: member.imagem_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este membro?")) return;
    if (!tenantId) return;

    try {
      const { error } = await db.from('members').delete().eq('id', id);

      if (error) throw error;
      toast({ title: "Membro excluído com sucesso!" });
      loadData(tenantId);
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o membro",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      apelido: "",
      email: "",
      telefone: "",
      data_nasc: "",
      ano_batismo: "",
      apto: true,
      imagem_url: "",
    });
    setEditingMember(null);
  };



  const handleFakeUpload = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setFormData({
      ...formData,
      imagem_url: `https://i.pravatar.cc/150?u=mem-${randomId}`,
    });
  };

  const handleCSVImport = async (data: any[]) => {
    if (!tenantId) return;

    try {
      const membersToImport = data.map(row => ({
        tenant_id: tenantId,
        nome_completo: row.nome_completo || "",
        apelido: row.apelido || null,
        email: row.email || null,
        telefone: row.telefone || null,
        data_nasc: row.data_nasc || null,
        ano_batismo: row.ano_batismo ? parseInt(row.ano_batismo) : null,
        apto: String(row.apto).toLowerCase() === 'sim' || String(row.apto).toLowerCase() === 'true',
        imagem_url: null,
      }));

      const { error } = await db.from('members').insert(membersToImport);

      if (error) throw error;

      toast({
        title: 'Importação concluída!',
        description: `${membersToImport.length} membro(s) importado(s) com sucesso.`,
      });

      loadData(tenantId);
    } catch (error) {
      console.error('Error importing members:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível importar os membros.',
        variant: 'destructive',
      });
      throw error; // Re-throw para que o componente CSVImporter saiba que falhou
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
            <h1 className="text-2xl font-bold">Membros</h1>
          </div>
          <div className="flex gap-2">
            <CSVImporter
              columns={[
                { key: 'nome_completo', label: 'Nome Completo', required: true, aliases: ['nome', 'name', 'full_name'] },
                { key: 'apelido', label: 'Apelido', aliases: ['nickname'] },
                { key: 'email', label: 'Email' },
                { key: 'telefone', label: 'Telefone', aliases: ['phone'] },
                { key: 'data_nasc', label: 'Data Nascimento', aliases: ['data_nascimento', 'birth_date'] },
                { key: 'ano_batismo', label: 'Ano Batismo', aliases: ['baptism_year'] },
                { key: 'apto', label: 'Apto', aliases: ['is_active', 'active'] },
              ]}
              onImport={handleCSVImport}
            />
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Membro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingMember ? "Editar Membro" : "Novo Membro"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                  <div className="relative mx-auto w-24 h-24 mb-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={formData.imagem_url || ""} alt={formData.nome_completo} />
                      <AvatarFallback>
                        <UserCircle2 className="w-12 h-12 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                      onClick={handleFakeUpload}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nome_completo" className="text-right">
                      Nome Completo
                    </Label>
                    <Input
                      id="nome_completo"
                      value={formData.nome_completo}
                      onChange={(e) =>
                        setFormData({ ...formData, nome_completo: e.target.value })
                      }
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="apelido" className="text-right">
                      Apelido
                    </Label>
                    <Input
                      id="apelido"
                      value={formData.apelido}
                      onChange={(e) =>
                        setFormData({ ...formData, apelido: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="telefone" className="text-right">
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) =>
                        setFormData({ ...formData, telefone: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="data_nasc" className="text-right">
                      Nascimento
                    </Label>
                    <Input
                      id="data_nasc"
                      type="date"
                      value={formData.data_nasc}
                      onChange={(e) =>
                        setFormData({ ...formData, data_nasc: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="ano_batismo" className="text-right">
                      Ano Batismo
                    </Label>
                    <Input
                      id="ano_batismo"
                      type="number"
                      value={formData.ano_batismo}
                      onChange={(e) =>
                        setFormData({ ...formData, ano_batismo: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="apto" className="text-right">
                      Apto
                    </Label>
                    <Switch
                      id="apto"
                      checked={formData.apto}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, apto: checked })
                      }
                    />
                  </div>
                  <Button type="submit" className="w-full mt-4">
                    {editingMember ? "Salvar Alterações" : "Cadastrar Membro"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Buscar membros por nome ou apelido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="space-y-2">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center p-3 bg-card rounded-lg border"
            >
              <div>
                <Avatar>
                  <AvatarImage src={member.imagem_url || ""} alt={member.nome_completo} />
                  <AvatarFallback>
                    <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold">{member.nome_completo}</p>
                {member.apelido && (
                  <p className="text-sm text-muted-foreground">
                    {member.apelido}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(member)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(member.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Nenhum membro cadastrado ainda.
            </p>
          </div>
        )}
      </main>
    </div >
  );
}
