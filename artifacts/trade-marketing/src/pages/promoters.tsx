import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, User, Phone, Mail, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Client {
  id: number;
  name: string;
}

interface Network {
  id: number;
  name: string;
}

interface Promoter {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: string;
  clientIds: number[];
  networkIds: number[];
}

export default function Promoters() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    isActive: "true",
    clientIds: [] as number[],
    networkIds: [] as number[],
  });

  const fetchData = async () => {
    try {
      // Buscar clientes
      const clientsRes = await fetch('/api/clients');
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      }

      // Buscar redes
      const networksRes = await fetch('/api/networks');
      if (networksRes.ok) {
        const data = await networksRes.json();
        setNetworks(data);
      }

      // Buscar promotores
      const promotersRes = await fetch('/api/promoters');
      if (promotersRes.ok) {
        const data = await promotersRes.json();
        setPromoters(data);
      } else {
        toast({ variant: "destructive", description: "Erro ao carregar promotores" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao carregar dados" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewDialog = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      isActive: "true",
      clientIds: [],
      networkIds: [],
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (promoter: Promoter) => {
    setFormData({
      name: promoter.name,
      phone: promoter.phone || "",
      email: promoter.email || "",
      isActive: promoter.isActive,
      clientIds: promoter.clientIds || [],
      networkIds: promoter.networkIds || [],
    });
    setEditingId(promoter.id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", description: "Nome é obrigatório" });
      return;
    }

    try {
      const url = editingId ? `/api/promoters/${editingId}` : '/api/promoters';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ description: editingId ? "Promotor atualizado!" : "Promotor criado!" });
        setIsDialogOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        toast({ variant: "destructive", description: error.error || "Erro ao salvar" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao salvar" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este promotor?")) return;

    try {
      const response = await fetch(`/api/promoters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: "Promotor excluído!" });
        fetchData();
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
  };

  const addItem = (type: 'clientIds' | 'networkIds', value: number) => {
    if (value && !formData[type].includes(value)) {
      setFormData({ ...formData, [type]: [...formData[type], value] });
    }
  };

  const removeItem = (type: 'clientIds' | 'networkIds', value: number) => {
    setFormData({
      ...formData,
      [type]: formData[type].filter(id => id !== value),
    });
  };

  const getClientName = (id: number) => {
    const client = clients.find(c => c.id === id);
    return client ? client.name : `ID: ${id}`;
  };

  const getNetworkName = (id: number) => {
    const network = networks.find(n => n.id === id);
    return network ? network.name : `ID: ${id}`;
  };

  const filteredPromoters = promoters.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase())) ||
    (p.phone && p.phone.includes(search))
  );

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Promotores</h1>
          <p className="text-muted-foreground mt-1">Gerencie os promotores de campo.</p>
        </div>
        <Button onClick={openNewDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Novo Promotor
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar promotores por nome, email ou telefone..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Redes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPromoters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum promotor cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredPromoters.map((promoter) => (
                <TableRow key={promoter.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {promoter.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {promoter.phone ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {promoter.phone}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {promoter.email ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {promoter.email}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {promoter.clientIds?.slice(0, 2).map((id) => (
                        <Badge key={id} variant="secondary" className="text-xs">
                          {getClientName(id)}
                        </Badge>
                      ))}
                      {promoter.clientIds?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{promoter.clientIds.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {promoter.networkIds?.slice(0, 2).map((id) => (
                        <Badge key={id} variant="outline" className="text-xs">
                          {getNetworkName(id)}
                        </Badge>
                      ))}
                      {promoter.networkIds?.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{promoter.networkIds.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promoter.isActive === "true" ? "default" : "secondary"}>
                      {promoter.isActive === "true" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(promoter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(promoter.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Promotor" : "Novo Promotor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Clientes Vinculados</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value=""
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value) addItem('clientIds', value);
                }}
              >
                <option value="">Selecione um cliente...</option>
                {clients.filter(c => c.isActive === "true").map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.clientIds.map((id) => (
                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                    {getClientName(id)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeItem('clientIds', id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Redes Vinculadas</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value=""
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value) addItem('networkIds', value);
                }}
              >
                <option value="">Selecione uma rede...</option>
                {networks.map((network) => (
                  <option key={network.id} value={network.id}>
                    {network.name}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.networkIds.map((id) => (
                  <Badge key={id} variant="outline" className="flex items-center gap-1">
                    {getNetworkName(id)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeItem('networkIds', id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive === "true"}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked ? "true" : "false" })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium">Promotor ativo</label>
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