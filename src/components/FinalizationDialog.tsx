// src/components/FinalizationDialog.tsx
import { useState } from "react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinalizationDialogProps {
    commission: {
        id: string;
        nome: string;
        status: string;
    };
    onFinalize: () => void;
}

/**
 * Gera uma chave de 6 dígitos para finalização
 * @returns String com 6 dígitos numéricos
 */
function generateFinalizationKey(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export function FinalizationDialog({
    commission,
    onFinalize,
}: FinalizationDialogProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [finalizationKey] = useState(() => generateFinalizationKey());
    const [inputKey, setInputKey] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleFinalize = async () => {
        // Validações
        if (inputKey !== finalizationKey) {
            toast({
                title: "Chave Incorreta",
                description: "A chave digitada não corresponde à chave exibida",
                variant: "destructive",
            });
            return;
        }

        if (!confirmed) {
            toast({
                title: "Confirmação Necessária",
                description: "Você deve confirmar que entende que esta ação é irreversível",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await db
                .from("commissions")
                .update({
                    status: "finalizada",
                    finalization_key: finalizationKey,
                    finalized_at: new Date().toISOString(),
                })
                .eq("id", commission.id);

            if (error) throw error;

            toast({
                title: "Comissão Finalizada",
                description: "A comissão foi finalizada com sucesso e não pode mais ser editada",
            });

            setOpen(false);
            onFinalize();
        } catch (error) {
            console.error("Erro ao finalizar comissão:", error);
            toast({
                title: "Erro",
                description: "Não foi possível finalizar a comissão",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const resetDialog = () => {
        setInputKey("");
        setConfirmed(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) resetDialog();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Lock className="h-4 w-4 mr-2" />
                    Finalizar Comissão
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Finalizar Comissão
                    </DialogTitle>
                    <DialogDescription>
                        Esta ação é <strong>irreversível</strong>. A comissão será bloqueada
                        para edição e votação.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Alert de aviso */}
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Após a finalização, não será mais possível:
                            <ul className="list-disc list-inside mt-2 text-sm">
                                <li>Adicionar ou remover cargos</li>
                                <li>Realizar votações</li>
                                <li>Editar configurações da comissão</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Exibição da chave */}
                    <div className="space-y-2">
                        <Label>Chave de Finalização</Label>
                        <div className="p-4 border-2 border-primary rounded-md bg-primary/5 text-center">
                            <p className="text-3xl font-mono font-bold tracking-wider">
                                {finalizationKey}
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Anote esta chave. Você precisará digitá-la para confirmar.
                        </p>
                    </div>

                    {/* Input da chave */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm-key">Digite a Chave de Finalização</Label>
                        <Input
                            id="confirm-key"
                            type="text"
                            placeholder="000000"
                            value={inputKey}
                            onChange={(e) => setInputKey(e.target.value)}
                            maxLength={6}
                            className="text-center text-2xl font-mono tracking-wider"
                        />
                    </div>

                    {/* Checkbox de confirmação */}
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="confirm-irreversible"
                            checked={confirmed}
                            onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                        />
                        <label
                            htmlFor="confirm-irreversible"
                            className="text-sm leading-tight cursor-pointer"
                        >
                            Eu entendo que esta ação é <strong>irreversível</strong> e confirmo
                            que desejo finalizar a comissão &quot;{commission.nome}&quot;
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleFinalize}
                        disabled={!inputKey || !confirmed || loading || inputKey !== finalizationKey}
                    >
                        {loading ? "Finalizando..." : "Finalizar Comissão"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
