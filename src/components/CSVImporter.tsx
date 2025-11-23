// src/components/CSVImporter.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";

interface ColumnDef {
    key: string;
    label: string;
    required?: boolean;
    aliases?: string[];
}

interface CSVImporterProps {
    columns: ColumnDef[];
    onImport: (data: any[]) => Promise<void>;
}

export function CSVImporter({ columns, onImport }: CSVImporterProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [fileName, setFileName] = useState<string>("");

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rawData = results.data as any[];

                // Normalize data based on aliases
                const normalizedData = rawData.map(row => {
                    const newRow = { ...row };
                    columns.forEach(col => {
                        // If key is missing but alias exists, map it
                        if (!(col.key in row) && col.aliases) {
                            for (const alias of col.aliases) {
                                if (alias in row) {
                                    newRow[col.key] = row[alias];
                                    break; // Use the first found alias
                                }
                            }
                        }
                    });
                    return newRow;
                });

                // Validate required columns on normalized data
                const missing = columns.filter(col => {
                    if (!col.required) return false;
                    const firstRow = normalizedData[0] || {};
                    return !(col.key in firstRow);
                });

                if (missing.length) {
                    toast({
                        title: "Erro de validação",
                        description: `Colunas obrigatórias ausentes: ${missing.map(m => m.label).join(", ")}`,
                        variant: "destructive",
                    });
                    setPreviewData([]);
                    return;
                }
                setPreviewData(normalizedData);
            },
            error: (err) => {
                toast({ title: "Erro ao ler CSV", description: err.message, variant: "destructive" });
            },
        });
    };

    const handleImport = async () => {
        if (!previewData.length) return;
        try {
            await onImport(previewData);
            setOpen(false);
            setPreviewData([]);
        } catch (e) {
            // onImport already shows toast on error
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">Importar CSV</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                    <DialogTitle>Importar Membros via CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input type="file" accept=".csv" onChange={handleFile} />
                    {fileName && <p className="text-sm text-muted-foreground">Arquivo: {fileName}</p>}
                    {previewData.length > 0 && (
                        <div className="overflow-x-auto max-h-64">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {columns.map(col => (
                                            <TableHead key={col.key}>{col.label}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.slice(0, 10).map((row, idx) => (
                                        <TableRow key={idx}>
                                            {columns.map(col => (
                                                <TableCell key={col.key}>{row[col.key]}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <p className="text-sm text-muted-foreground mt-2">Mostrando 10 de {previewData.length} linhas.</p>
                        </div>
                    )}
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleImport} disabled={!previewData.length}>
                            Importar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
