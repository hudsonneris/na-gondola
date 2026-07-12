import { useState, useEffect } from "react";
import { useListStores } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, MapPin, Edit, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

interface Network {
  id: number;
  name: string;
}

interface Store {
  id: number;
  name: string;
  city: string;
  networkId: number | null;
}

interface ScheduledVisit {
  id: number;
  storeId: number;
  storeName: string;
  storeCity: string;
  storeState: string;
  storeChannel: string;
  networkId: number | null;
  networkName: string | null;
  daysOfWeek: number[];
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  isActive: boolean;
}

export default function Tasks() {
  const [scheduledVisits, setScheduledVisits] = useState<ScheduledVisit[]>([]);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const { toast } = useToast();

  // 🔥 Dias da semana selecionados (checkbox)
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    networkId: "",
    storeId: "",
    daysOfWeek: [] as number[],
    startTime: "",
    endTime: "",
    notes: "",
    isActive: true,
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
      const storesRes = await fetch('/api/stores');
      if (storesRes.ok) {
        const data = await storesRes.json();
        setStores(data);
        setFilteredStores(data);
      }

      // Buscar tarefas
      const tasksRes = await fetch('/api/scheduled-visits');
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setScheduledVisits(data);
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

  // 🔥 Filtrar lojas por rede
  useEffect(() => {
    if (formData.networkId) {
      const filtered = stores.filter(s => s.networkId === Number(formData.networkId));
      setFilteredStores(filtered);
    } else {
      setFilteredStores(stores);
    }
  }, [formData.networkId, stores]);

  const openNewDialog = () => {
    setFormData({
      networkId: "",
      storeId: "",
      daysOfWeek: [],
      startTime: "",
      endTime: "",
      notes: "",
      isActive: true,
    });
    setSelectedDays([]);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: ScheduledVisit) => {
    setFormData({
      networkId: item.networkId?.toString() || "",
      storeId: item.storeId.toString(),
      daysOfWeek: item.daysOfWeek || [],
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      notes: item.notes || "",
      isActive: item.isActive,
    });
    setSelectedDays(item.daysOfWeek || []);
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => {
      const newDays = prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day];
      setFormData(prevData => ({ ...prevData, daysOfWeek: newDays }));
      return newDays;
    });
  };

  const handleSave = async () => {
    if (!formData.storeId || formData.daysOfWeek.length === 0) {
      toast({ variant: "destructive", description: "Selecione uma loja e pelo menos um dia da semana" });
      return;
    }

    const data = {
      storeId: Number(formData.storeId),
      networkId: formData.networkId ? Number(formData.networkId) : null,
      daysOfWeek: formData.daysOfWeek,
      startTime: formData.startTime || null,
      endTime: formData.endTime || null,
      notes: formData.notes || null,
      isActive: formData.isActive,
    };

    try {
      const url = editingId ? `/api/scheduled-visits/${editingId}` : '/api/scheduled-visits';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ description: editingId ? "Tarefa atualizada!" : "Tarefa criada!" });
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
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

    try {
      const response = await fetch(`/api/scheduled-visits/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: "Tarefa excluída!" });
        fetchData();
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
  };

  const filteredVisits = selectedDay === "all" 
    ? scheduledVisits 
    : scheduledVisits.filter(v => v.daysOfWeek?.includes(Number(selectedDay)));

  const getDayNames = (days: number[]) => {
    return days.map(d => DAYS_OF_WEEK[d]).join(', ');
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tarefas Agendadas</h1>
          <p className="text-muted-foreground mt-1">Gerencie as visitas programadas por dia da semana.</p>
        </div>
        <Button onClick={openNewDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedDay === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDay("all")}
        >
          Todos
        </Button>
        {DAYS_OF_WEEK.map((day, index) => (
          <Button
            key={index}
            variant={selectedDay === index.toString() ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDay(index.toString())}
          >
            {day}
          </Button>
        ))}
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loja</TableHead>
              <TableHead>Rede</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhuma tarefa agendada.
                </TableCell>
              </TableRow>
            ) : (
              filteredVisits.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {item.storeName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.storeCity}, {item.storeState} • {item.storeChannel}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.networkName ? (
                      <Badge variant="secondary" className="text-xs">
                        {item.networkName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.daysOfWeek?.map((day) => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {DAYS_OF_WEEK[day]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.startTime ? (
                      <span className="font-mono text-sm">
                        {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" /> Inativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Tarefa" : "Nova Tarefa Agendada"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rede</label>
              <Select 
                value={formData.networkId} 
                onValueChange={(val) => setFormData({ ...formData, networkId: val, storeId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma rede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as redes</SelectItem>
                  {networks.map((network) => (
                    <SelectItem key={network.id} value={network.id.toString()}>
                      {network.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Loja *</label>
              <Select 
                value={formData.storeId} 
                onValueChange={(val) => setFormData({ ...formData, storeId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name} ({store.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dias da Semana *</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <label
                    key={index}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm cursor-pointer hover:bg-muted/50 transition-colors
                      ${selectedDays.includes(index) ? 'bg-primary/10 border-primary' : 'border-border'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(index)}
                      onChange={() => handleDayToggle(index)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {day}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Início</label>
                <Input 
                  type="time" 
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Fim</label>
                <Input 
                  type="time" 
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre esta tarefa..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label className="text-sm font-medium">Tarefa ativa</label>
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