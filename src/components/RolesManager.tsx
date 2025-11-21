// src/components/RolesManager.tsx
import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { DEFAULT_ROLES, getDefaultRolesForCommission } from "@/lib/default-roles";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, ChevronUp, ChevronDown, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RolesManagerProps {
    commissionId: string;
    onRolesUpdated?: () => void;
}

interface CommissionRole {
    id: string;
    commission_id: string;
    nome_cargo: string;
    max_selecoes: number;
    ordem: number;
    ativo: boolean;
}

export function RolesManager({ commissionId, onRolesUpdated }: RolesManagerProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [roles, setRoles] = useState<CommissionRole[]>([]);
    const [loading, setLoading] = useState(false);
    const [newRole, setNewRole] = useState({ nome_cargo: "", max_selecoes: 1 });

    useEffect(() => {
        if (open) {
            loadRoles();
        }
    }, [open]);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const { data, error } = await db
                .from("commission_roles")
                .select("*")
                .eq("commission_id", commissionId)
                .eq("ativo", true);

            if (error) throw error;

            // Ordenar por ordem
            const sortedRoles = (data || []).sort((a, b) => a.ordem - b.ordem);
            setRoles(sortedRoles);
        } catch (error) {
            console.error("Erro ao carregar cargos:", error);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os cargos",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const importDefaultRoles = async () => {
        if (roles.length > 0) {
            const confirmed = window.confirm(
                "Já existem cargos configurados. Importar os cargos padrão irá substituí-los. Deseja continuar?"
            );
            if (!confirmed) return;

            // Desativar cargos existentes
            await db
                .from("commission_roles")
                .update({ ativo: false })
                .eq("commission_id", commissionId);
        }

        setLoading(true);
        try {
            const defaultRoles = getDefaultRolesForCommission(commissionId);

            const { error } = await db.from("commission_roles").insert(defaultRoles);

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: `${DEFAULT_ROLES.length} cargos padrão importados com sucesso`,
            });

            loadRoles();
            onRolesUpdated?.();
        } catch (error) {
            console.error("Erro ao importar cargos:", error);
            toast({
                title: "Erro",
                description: "Não foi possível importar os cargos padrão",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const addCustomRole = async () => {
        if (!newRole.nome_cargo.trim()) {
            toast({
                title: "Erro",
                description: "Digite um nome para o cargo",
                variant: "destructive",
            });
            return;
        }

        try {
            const maxOrder = roles.length > 0 ? Math.max(...roles.map(r => r.ordem)) : 0;

            const { error } = await db.from("commission_roles").insert({
                commission_id: commissionId,
                nome_cargo: newRole.nome_cargo,
                max_selecoes: newRole.max_selecoes,
                ordem: maxOrder + 1,
                ativo: true,
            });

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Cargo adicionado",
            });

            setNewRole({ nome_cargo: "", max_selecoes: 1 });
            loadRoles();
            onRolesUpdated?.();
        } catch (error) {
            console.error("Erro ao adicionar cargo:", error);
            toast({
                title: "Erro",
                description: "Não foi possível adicionar o cargo",
                variant: "destructive",
            });
        }
    };

    const deleteRole = async (roleId: string) => {
        try {
            const { error } = await db
                .from("commission_roles")
                .update({ ativo: false })
                .eq("id", roleId);

            if (error) throw error;

            toast({
                title: "Sucesso",
                description: "Cargo removido",
            });

            loadRoles();
            onRolesUpdated?.();
        } catch (error) {
            console.error("Erro ao remover cargo:", error);
            toast({
                title: "Erro",
                description: "Não foi possível remover o cargo",
                variant: "destructive",
            });
        }
    };

    const moveRole = async (index: number, direction: "up" | "down") => {
        if (
            (direction === "up" && index === 0) ||
            (direction === "down" && index === roles.length - 1)
        ) {
            return;
        }

        const newIndex = direction === "up" ? index - 1 : index + 1;
        const newRoles = [...roles];
        [newRoles[index], newRoles[newIndex]] = [newRoles[newIndex], newRoles[index]];

        // Atualizar ordem
        const updates = newRoles.map((role, idx) => ({
            id: role.id,
            ordem: idx + 1,
        }));

        try {
            for (const update of updates) {
                await db
                    .from("commission_roles")
                    .update({ ordem: update.ordem })
                    .eq("id", update.id);
            }

            setRoles(newRoles);
            onRolesUpdated?.();
        } catch (error) {
            console.error("Erro ao reordenar cargo:", error);
            toast({
                title: "Erro",
                description: "Não foi possível reordenar o cargo",
                variant: "destructive",
            });
        }
    };

    const updateMaxSelections = async (roleId: string, newMax: number) => {
        if (newMax < 1) return;

        try {
            const { error } = await db
                .from("commission_roles")
                .update({ max_selecoes: newMax })
                .eq("id", roleId);

            if (error) throw error;

            setRoles(roles.map(r => r.id === roleId ? { ...r, max_selecoes: newMax } : r));
            onRolesUpdated?.();
        } catch (error) {
            console.error("Erro ao atualizar cargo:", error);
            toast({
                title: "Erro",
                description: "Não foi possível atualizar o cargo",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Gerenciar Cargos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Gerenciar Cargos da Comissão</DialogTitle>
                    <DialogDescription>
                        Configure os cargos que serão votados nesta comissão
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Botão importar cargos padrão */}
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <p className="font-medium">Cargos Padrão</p>
                            <p className="text-sm text-muted-foreground">
                                Importar os {DEFAULT_ROLES.length} cargos padrão da especificação
                            </p>
                        </div>
                        <Button onClick={importDefaultRoles} disabled={loading}>
                            <Download className="h-4 w-4 mr-2" />
                            Importar Padrão
                        </Button>
                    </div>

                    {/* Lista de cargos */}
                    <div>
                        <Label className="mb-2 block">Cargos Configurados ({roles.length})</Label>
                        <ScrollArea className="h-[300px] border rounded-md p-4">
                            {loading ? (
                                <p className="text-center text-muted-foreground">Carregando...</p>
                            ) : roles.length === 0 ? (
                                <p className="text-center text-muted-foreground">
                                    Nenhum cargo configurado. Importe os cargos padrão ou adicione manualmente.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {roles.map((role, index) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center gap-2 p-2 border rounded-md"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5"
                                                    onClick={() => moveRole(index, "up")}
                                                    disabled={index === 0}
                                                >
                                                    <ChevronUp className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5"
                                                    onClick={() => moveRole(index, "down")}
                                                    disabled={index === roles.length - 1}
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="flex-1">
                                                <p className="font-medium">{role.nome_cargo}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`max-${role.id}`} className="text-xs">
                                                    Máx:
                                                </Label>
                                                <Input
                                                    id={`max-${role.id}`}
                                                    type="number"
                                                    min="1"
                                                    value={role.max_selecoes}
                                                    onChange={(e) =>
                                                        updateMaxSelections(role.id, parseInt(e.target.value))
                                                    }
                                                    className="w-16 h-8"
                                                />
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteRole(role.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    {/* Adicionar cargo customizado */}
                    <div className="border-t pt-4">
                        <Label className="mb-2 block">Adicionar Cargo Customizado</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nome do cargo"
                                value={newRole.nome_cargo}
                                onChange={(e) =>
                                    setNewRole({ ...newRole, nome_cargo: e.target.value })
                                }
                                onKeyPress={(e) => e.key === "Enter" && addCustomRole()}
                            />
                            <Input
                                type="number"
                                min="1"
                                placeholder="Máx"
                                value={newRole.max_selecoes}
                                onChange={(e) =>
                                    setNewRole({ ...newRole, max_selecoes: parseInt(e.target.value) || 1 })
                                }
                                className="w-20"
                            />
                            <Button onClick={addCustomRole}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
