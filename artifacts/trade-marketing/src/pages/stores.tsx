import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MapPin, Edit, Trash2, Building, Store as StoreIcon, DollarSign, Phone } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

interface Network {
  id: number;
  name: string;
}

interface Store {
  id: number;
  name: string;
  networkId: number | null;
  networkName: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  complement: string | null;
  city: string;
  state: string;
  zipCode: string | null;
  phone: string | null;
  channel: string;
  storeCode: string | null;
  visitValue: string | null;
}

const storeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  networkId: z.number().optional().nullable(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  complement: z.string().optional(),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  channel: z.string().min(1, "Canal é obrigatório"),
  storeCode: z.string().optional(),
  visitValue: z.coerce.number().min(0, "Valor não pode ser negativo").optional(),
});

type StoreFormValues = z.infer<typeof storeSchema>;

const STORE_TYPES = [
  "Supermercado",
  "Hipermercado",
  "Farmácia",
  "Loja de Conveniência",
  "Atacado",
  "Varejo",
  "Outlet",
  "Outro",
];

export default function Stores() {
  const [search, setSearch] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { toast } = useToast();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: { 
      name: "", 
      networkId: null,
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      channel: "",
      storeCode: "",
      visitValue: undefined,
    },
  });

  const fetchData = async () => {
    try {
      // Buscar redes
      const networksRes = await fetch('/api/networks');
      if (networksRes.ok) {
        const data = await networksRes.json();
        setNetworks(data);
      }

      // Buscar lojas
      const storesRes = await fetch(`/api/stores?_=${Date.now()}`);
      if (storesRes.ok) {
        const data = await storesRes.json();
        setStores(data);
        setRefreshKey(prev => prev + 1);
      } else {
        toast({ variant: "destructive", description: "Erro ao carregar lojas" });
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

  const filteredStores = stores?.filter((store) => 
    store.name.toLowerCase().includes(search.toLowerCase()) || 
    store.city.toLowerCase().includes(search.toLowerCase()) ||
    (store.networkName && store.networkName.toLowerCase().includes(search.toLowerCase())) ||
    (store.storeCode && store.storeCode.toLowerCase().includes(search.toLowerCase()))
  );

  const openNewStoreDialog = () => {
    form.reset({ 
      name: "", 
      networkId: null,
      street: "",
      number: "",
      neighborhood: "",
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      channel: "",
      storeCode: "",
      visitValue: undefined,
    });
    setEditingStoreId(null);
    setIsDialogOpen(true);
  };

  const openEditStoreDialog = (store: Store) => {
    form.reset({
      name: store.name,
      networkId: store.networkId || null,
      street: store.street || "",
      number: store.number || "",
      neighborhood: store.neighborhood || "",
      complement: store.complement || "",
      city: store.city,
      state: store.state,
      zipCode: store.zipCode || "",
      phone: store.phone || "",
      channel: store.channel,
      storeCode: store.storeCode || "",
      visitValue: store.visitValue ? parseFloat(store.visitValue) : undefined,
    });
    setEditingStoreId(store.id);
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: StoreFormValues) => {
    try {
      const url = editingStoreId ? `/api/stores/${editingStoreId}` : '/api/stores';
      const method = editingStoreId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ description: editingStoreId ? "Loja atualizada com sucesso" : "Loja criada com sucesso" });
        setIsDialogOpen(false);
        await fetchData();
      } else {
        const error = await response.json();
        toast({ variant: "destructive", description: error.error || "Erro ao salvar" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao salvar" });
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a loja "${name}"?`)) return;

    try {
      const response = await fetch(`/api/stores/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: "Loja excluída" });
        await fetchData();
      } else {
        toast({ variant: "destructive", description: "Erro ao excluir" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
  };

  // 🔥 Máscara de telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    form.setValue('phone', formatted);
  };

  // 🔥 Máscara de CEP
  const formatZipCode = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatZipCode(e.target.value);
    form.setValue('zipCode', formatted);
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
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lojas</h1>
          <p className="text-muted-foreground mt-1">Gerencie os pontos de venda e canais.</p>
        </div>
        <Button onClick={openNewStoreDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Loja
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar lojas por nome, rede, código..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loja</TableHead>
              <TableHead>Rede</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-right">Valor Visita</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {search ? "Nenhuma loja encontrada para esta busca." : "Nenhuma loja cadastrada."}
                </TableCell>
              </TableRow>
            ) : (
              filteredStores?.map((store, index) => (
                <TableRow key={`${store.id}-${refreshKey}-${index}`}>
                  <TableCell className="font-medium">
                    <Link href={`/stores/${store.id}`} className="hover:underline text-primary">
                      {store.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {store.street && `${store.street}, ${store.number || 'S/N'}`}
                      {store.neighborhood && ` - ${store.neighborhood}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    {store.networkName ? (
                      <Badge variant="secondary" className="flex w-fit items-center gap-1">
                        <Building className="h-3 w-3" />
                        {store.networkName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {store.storeCode || <span className="text-muted-foreground text-xs">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground text-sm gap-1">
                      <MapPin className="h-3 w-3" />
                      {store.city}, {store.state}
                    </div>
                    {store.phone && (
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <Phone className="h-2 w-2" />
                        {store.phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {store.visitValue ? (
                      <span className="text-primary">{formatCurrency(store.visitValue)}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditStoreDialog(store)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id, store.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
            <DialogTitle>{editingStoreId ? "Editar Loja" : "Adicionar Loja"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome da Loja *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Supermercado Centro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="networkId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Rede</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        >
                          <option value="">Selecione uma rede...</option>
                          {networks.map((network) => (
                            <option key={network.id} value={network.id}>
                              {network.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código da Loja</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: LOJA-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(99) 99999-9999" 
                          {...field}
                          onChange={handlePhoneChange}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input placeholder="Rua" {...field} />
                        </div>
                        <Input 
                          placeholder="Número" 
                          {...form.register('number')}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Input 
                          placeholder="Bairro" 
                          {...form.register('neighborhood')}
                        />
                        <Input 
                          placeholder="Complemento" 
                          {...form.register('complement')}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000-000" 
                          {...field}
                          onChange={handleZipCodeChange}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São Paulo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: SP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Canal *</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {STORE_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visitValue"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Valor da Visita (R$)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0,00" 
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">
                  {editingStoreId ? "Salvar Alterações" : "Criar Loja"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}