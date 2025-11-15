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

// Interface alinhada com o schema do localStorage/client.ts
interface Member {
  id: string;
  full_name: string;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  baptism_year?: number | null;
  is_active: boolean;
  tenant_id: string;
  avatar_url?: string | null;
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
    full_name: "",
    nickname: "",
    email: "",
    phone: "",
    birth_date: "",
    baptism_year: "",
    is_active: true,
    avatar_url: "",
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
      // CORREÇÃO: Ordem da query
      const { data: membersData, error } = await db
        .from("members")
        .eq("tenant_id", tenantId)
        .select("*");

      if (error) throw error;
      const sortedMembers = (membersData || []).sort((a, b) =>
        a.full_name.localeCompare(b.full_name)
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
      member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.nickname &&
        member.nickname.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    try {
      const memberData = {
        tenant_id: tenantId,
        full_name: formData.full_name,
        nickname: formData.nickname || null,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        baptism_year: formData.baptism_year
          ? parseInt(formData.baptism_year)
          : null,
        is_active: formData.is_active,
        avatar_url: formData.avatar_url || null,
      };

      if (editingMember) {
        // CORREÇÃO: Ordem da query
        const { error } = await db
          .from("members")
          .eq("id", editingMember.id)
          .update(memberData);

        if (error) throw error;
        toast({ title: "Membro atualizado com sucesso!" });
      } else {
        const { error } = await db.from("members").insert(memberData);

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
      full_name: member.full_name,
      nickname: member.nickname || "",
      email: member.email || "",
      phone: member.phone || "",
      birth_date: member.birth_date || "",
      baptism_year: member.baptism_year?.toString() || "",
      is_active: member.is_active,
      avatar_url: member.avatar_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este membro?")) return;
    if (!tenantId) return;

    try {
      // CORREÇÃO: Ordem da query
      const { error } = await db.from("members").eq("id", id).delete();

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
      full_name: "",
      nickname: "",
      email: "",
      phone: "",
      birth_date: "",
      baptism_year: "",
      is_active: true,
      avatar_url: "",
    });
    setEditingMember(null);
  };



  const handleFakeUpload = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setFormData({
      ...formData,
      avatar_url: `https://i.pravatar.cc/150?u=mem-${randomId}`,
    });
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
                    <AvatarImage src={formData.avatar_url || ""} alt={formData.full_name} />
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
                  <Label htmlFor="full_name" className="text-right">
                    Nome Completo
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nickname" className="text-right">
                    Apelido
                  </Label>
                  <Input
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) =>
                      setFormData({ ...formData, nickname: e.target.value })
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
                  <Label htmlFor="phone" className="text-right">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="birth_date" className="text-right">
                    Nascimento
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) =>
                      setFormData({ ...formData, birth_date: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="baptism_year" className="text-right">
                    Ano Batismo
                  </Label>
                  <Input
                    id="baptism_year"
                    type="number"
                    value={formData.baptism_year}
                    onChange={(e) =>
                      setFormData({ ...formData, baptism_year: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_active" className="text-right">
                    Apto
                  </Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
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
                  <AvatarImage src={member.avatar_url || ""} alt={member.full_name} />
                  <AvatarFallback>
                    <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="ml-4 flex-grow">
                <p className="font-semibold">{member.full_name}</p>
                {member.nickname && (
                  <p className="text-sm text-muted-foreground">
                    {member.nickname}
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
    </div>
  );
}
