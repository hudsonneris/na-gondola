import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SupplyStatus {
  id: number;
  name: string;
  type: "positive" | "negative";
  order: number;
  isActive: boolean;
}

export default function SupplyStatusPage() {
  const [statuses, setStatuses] = useState<SupplyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    type: "positive" as "positive" | "negative",
    isActive: true,
  });

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/supply-status');
      const data = await response.json();
      setStatuses(data);
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao carregar status" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const openNewDialog = () => {
    setFormData({
      name: "",
      type: "positive",
      isActive: true,
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (status: SupplyStatus) => {
    setFormData({
      name: status.name,
      type: status.type,
      isActive: status.isActive,
    });
    setEditingId(status.id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", description: "Nome é obrigatório" });
      return;
    }

    const data = {
      name: formData.name,
      type: formData.type,
      isActive: formData.isActive,
    };

    try {
      const url = editingId ? `/api/supply-status/${editingId}` : '/api/supply-status';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ description: editingId ? "Status atualizado!" : "Status criado!" });
        setIsDialogOpen(false);
        fetchStatuses();
      } else {
        const error = await response.json();
        toast({ variant: "destructive", description: error.error || "Erro ao salvar" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao salvar" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o status "${name}"?`)) return;

    try {
      const response = await fetch(`/api/supply-status/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: "Status excluído!" });
        fetchStatuses();
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    const status = statuses.find(s => s.id === id);
    if (!status) return;

    try {
      const response = await fetch(`/api/supply-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...status,
          isActive: !currentActive,
        }),
      });

      if (response.ok) {
        toast({ description: `Status ${!currentActive ? 'ativado' : 'desativado'}!` });
        fetchStatuses();
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao alterar status" });
    }
  };

  const filteredStatuses = statuses.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupar por tipo
  const positiveStatuses = filteredStatuses.filter(s => s.type === "positive");
  const negativeStatuses = filteredStatuses.filter(s => s.type === "negative");

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Situação do Abastecimento</h1>
          <p className="text-muted-foreground mt-1">Gerencie os termos para avaliação de abastecimento.</p>
        </div>
        <Button onClick={openNewDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Novo Status
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar status por nome..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Positivos */}
        <div className="border rounded-md bg-card overflow-hidden">
          <div className="bg-green-50 dark:bg-green-950/20 px-4 py-3 border-b">
            <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
              <span className="text-lg">✅</span> Status Positivos
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positiveStatuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    Nenhum status positivo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                positiveStatuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={status.isActive ? "default" : "secondary"}
                        className={status.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {status.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleActive(status.id, status.isActive)}
                        >
                          {status.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(status)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(status.id, status.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Status Negativos */}
        <div className="border rounded-md bg-card overflow-hidden">
          <div className="bg-red-50 dark:bg-red-950/20 px-4 py-3 border-b">
            <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
              <span className="text-lg">❌</span> Status Negativos
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negativeStatuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    Nenhum status negativo cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                negativeStatuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell className="font-medium">{status.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={status.isActive ? "default" : "secondary"}
                        className={status.isActive ? "bg-red-100 text-red-800" : ""}
                      >
                        {status.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleToggleActive(status.id, status.isActive)}
                        >
                          {status.isActive ? "Desativar" : "Ativar"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(status)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(status.id, status.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Status" : "Novo Status"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Organizado, Fora de estoque..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select 
                value={formData.type} 
                onValueChange={(val: "positive" | "negative") => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">✅ Positivo</SelectItem>
                  <SelectItem value="negative">❌ Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium">Status ativo</label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>
                {editingId ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}