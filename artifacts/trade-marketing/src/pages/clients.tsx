import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, Building, X, MapPin } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Network {
  id: number;
  name: string;
}

interface Client {
  id: number;
  name: string;
  code: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  isActive: string;
  networkIds: number[];
  networks: string[];
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    cnpj: "",
    phone: "",
    email: "",
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
    isActive: "true",
    networkIds: [] as number[],
  });

  const fetchData = async () => {
    try {
      const networksRes = await fetch('/api/networks');
      if (networksRes.ok) {
        const data = await networksRes.json();
        setNetworks(data);
      }

      const clientsRes = await fetch('/api/clients');
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data);
      } else {
        toast({ variant: "destructive", description: "Erro ao carregar clientes" });
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
      code: "",
      cnpj: "",
      phone: "",
      email: "",
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
      isActive: "true",
      networkIds: [],
    });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setFormData({
      name: client.name,
      code: client.code || "",
      cnpj: client.cnpj || "",
      phone: client.phone || "",
      email: client.email || "",
      street: client.street || "",
      number: client.number || "",
      neighborhood: client.neighborhood || "",
      complement: client.complement || "",
      city: client.city || "",
      state: client.state || "",
      zipCode: client.zipCode || "",
      notes: client.notes || "",
      isActive: client.isActive,
      networkIds: client.networkIds || [],
    });
    setEditingId(client.id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", description: "Nome é obrigatório" });
      return;
    }

    try {
      const url = editingId ? `/api/clients/${editingId}` : '/api/clients';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({ description: editingId ? "Cliente atualizado!" : "Cliente criado!" });
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
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: "Cliente excluído!" });
        fetchData();
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
  };

  const addNetwork = (networkId: number) => {
    if (!formData.networkIds.includes(networkId)) {
      setFormData({ ...formData, networkIds: [...formData.networkIds, networkId] });
    }
  };

  const removeNetwork = (networkId: number) => {
    setFormData({
      ...formData,
      networkIds: formData.networkIds.filter(id => id !== networkId),
    });
  };

  const getNetworkName = (id: number) => {
    const network = networks.find(n => n.id === id);
    return network ? network.name : `ID: ${id}`;
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.code && c.code.toLowerCase().includes(search.toLowerCase())) ||
    (c.cnpj && c.cnpj.includes(search))
  );

  // 🔥 Função para formatar CNPJ
  const formatCnpj = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return value;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    setFormData({ ...formData, cnpj: formatted });
  };

  // 🔥 Função para formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // 🔥 Função para formatar CEP
  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipCode(e.target.value);
    setFormData({ ...formData, zipCode: formatted });
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie as indústrias e clientes atendidos.</p>
        </div>
        <Button onClick={openNewDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar clientes por nome, código ou CNPJ..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Redes Vinculadas</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {client.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{client.code || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{client.cnpj || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {client.networks?.slice(0, 3).map((network) => (
                        <Badge key={network} variant="secondary" className="text-xs">
                          {network}
                        </Badge>
                      ))}
                      {client.networks?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.networks.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {client.street || client.city ? (
                      <div className="text-xs text-muted-foreground">
                        {client.street && `${client.street}, ${client.number || 'S/N'}`}
                        {client.neighborhood && <span className="block">{client.neighborhood}</span>}
                        {client.city && client.state && <span>{client.city}/{client.state}</span>}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.isActive === "true" ? "default" : "secondary"}>
                      {client.isActive === "true" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: COTHERPACK"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Código</label>
                <Input 
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: CLT-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CNPJ</label>
                <Input 
                  value={formData.cnpj}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input 
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            {/* 🔥 Endereço separado */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Endereço</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Input 
                    placeholder="Rua" 
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
                <Input 
                  placeholder="Número" 
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input 
                  placeholder="Bairro" 
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                />
                <Input 
                  placeholder="Complemento" 
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input 
                  placeholder="Cidade" 
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input 
                  placeholder="UF" 
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                />
                <Input 
                  placeholder="CEP" 
                  value={formData.zipCode}
                  onChange={handleZipCodeChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Redes Vinculadas</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value=""
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (value) addNetwork(value);
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
                  <Badge key={id} variant="secondary" className="flex items-center gap-1">
                    {getNetworkName(id)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeNetwork(id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o cliente..."
                className="min-h-[60px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive === "true"}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked ? "true" : "false" })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium">Cliente ativo</label>
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