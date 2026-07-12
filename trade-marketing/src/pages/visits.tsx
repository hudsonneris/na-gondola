import { useState, useEffect } from "react";
import { useListVisits, useDeleteVisit, getListVisitsQueryKey, getGetRecentVisitsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Eye, MapPin, Calendar, Clock, Edit, Filter, X, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const safeFormatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('pt-BR');
  } catch {
    return "-";
  }
};

const getDuration = (visit: any) => {
  if (visit.duration_minutes) {
    const hours = Math.floor(visit.duration_minutes / 60);
    const mins = visit.duration_minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  }
  
  if (visit.check_in && visit.check_out) {
    const start = new Date(visit.check_in);
    const end = new Date(visit.check_out);
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
    if (diffMinutes > 0) {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (hours === 0) return `${mins}min`;
      return `${hours}h ${mins}min`;
    }
  }
  
  return "-";
};

export default function Visits() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const initialFilter = searchParams.get('filter') || 'all';
  
  const { data: visits, isLoading } = useListVisits();
  const deleteVisit = useDeleteVisit();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // 🔥 Filtros - valores temporários (antes de aplicar)
  const [tempStatusFilter, setTempStatusFilter] = useState<string>("all");
  const [tempOccurrenceFilter, setTempOccurrenceFilter] = useState<string>(initialFilter === 'occurrences' ? 'yes' : initialFilter === 'out-of-stock' ? 'yes' : 'all');
  const [tempSearchStore, setTempSearchStore] = useState<string>("");
  const [tempStartDate, setTempStartDate] = useState<string>("");
  const [tempEndDate, setTempEndDate] = useState<string>("");
  
  // 🔥 Filtros aplicados (usados na query)
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [occurrenceFilter, setOccurrenceFilter] = useState<string>(initialFilter === 'occurrences' ? 'yes' : initialFilter === 'out-of-stock' ? 'yes' : 'all');
  const [searchStore, setSearchStore] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [itemsData, setItemsData] = useState<Record<number, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({});

  // 🔥 Função para buscar items de uma visita
  const fetchItems = async (visitId: number) => {
    if (itemsData[visitId] || loadingItems[visitId]) return;
    
    setLoadingItems(prev => ({ ...prev, [visitId]: true }));
    
    try {
      const response = await fetch(`/api/visits/${visitId}`);
      const data = await response.json();
      
      if (data && data.items) {
        console.log(`Items da visita ${visitId}:`, data.items);
        setItemsData(prev => ({ ...prev, [visitId]: data.items }));
      } else {
        setItemsData(prev => ({ ...prev, [visitId]: [] }));
      }
    } catch (error) {
      console.error(`Erro ao buscar items da visita ${visitId}:`, error);
      setItemsData(prev => ({ ...prev, [visitId]: [] }));
    } finally {
      setLoadingItems(prev => ({ ...prev, [visitId]: false }));
    }
  };

  // 🔥 Buscar items para todas as visitas ao carregar
  useEffect(() => {
    if (visits) {
      visits.forEach((visit) => {
        if (visit.id && !itemsData[visit.id]) {
          fetchItems(visit.id);
        }
      });
    }
  }, [visits]);

  const sortedVisits = visits ? [...visits].sort((a, b) => {
    const dateA = a?.visited_at ? new Date(a.visited_at).getTime() : 0;
    const dateB = b?.visited_at ? new Date(b.visited_at).getTime() : 0;
    return dateB - dateA;
  }) : [];

  // 🔥 Função para verificar se uma visita tem ocorrências
  const hasOccurrences = (visitId: number) => {
    const items = itemsData[visitId] || [];
    return items.some((item: any) => 
      item.in_stock === false || 
      (item.supply_status && item.supply_status.length > 0)
    );
  };

  // 🔥 Função para contar ocorrências
  const getOccurrenceCount = (visitId: number) => {
    const items = itemsData[visitId] || [];
    let count = 0;
    items.forEach((item: any) => {
      if (item.in_stock === false) count++;
      if (item.supply_status && item.supply_status.length > 0) {
        count += item.supply_status.length;
      }
    });
    return count;
  };

  // 🔥 Função para contar fora de estoque
  const getOutOfStockCount = (visitId: number) => {
    const items = itemsData[visitId] || [];
    return items.filter((item: any) => item.in_stock === false).length;
  };

  // 🔥 Função para verificar se a visita tem itens carregados
  const isItemsLoaded = (visitId: number) => {
    return itemsData[visitId] !== undefined || loadingItems[visitId];
  };

  // 🔥 Aplicar filtros
  const filteredVisits = sortedVisits.filter((visit) => {
    if (!visit) return false;

    if (statusFilter !== 'all' && visit.status !== statusFilter) return false;

    if (occurrenceFilter !== 'all') {
      const hasOcc = hasOccurrences(visit.id);
      if (occurrenceFilter === 'yes' && !hasOcc) return false;
      if (occurrenceFilter === 'no' && hasOcc) return false;
    }

    if (searchStore && !visit.store_name?.toLowerCase().includes(searchStore.toLowerCase())) return false;

    if (startDate && visit.visited_at && new Date(visit.visited_at) < new Date(startDate)) return false;
    if (endDate && visit.visited_at && new Date(visit.visited_at) > new Date(endDate)) return false;

    return true;
  });

  const applyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setOccurrenceFilter(tempOccurrenceFilter);
    setSearchStore(tempSearchStore);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
  };

  const clearFilters = () => {
    setTempStatusFilter('all');
    setTempOccurrenceFilter('all');
    setTempSearchStore('');
    setTempStartDate('');
    setTempEndDate('');
    setStatusFilter('all');
    setOccurrenceFilter('all');
    setSearchStore('');
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = (id: number, status?: string) => {
    const message = status === 'draft' 
      ? "Tem certeza que deseja excluir este rascunho?" 
      : "Tem certeza que deseja excluir este relatório de visita?";
    
    if (confirm(message)) {
      deleteVisit.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentVisitsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            toast({ description: status === 'draft' ? "Rascunho excluído com sucesso" : "Visita excluída com sucesso" });
          },
        }
      );
    }
  };

  const hasActiveFilters = statusFilter !== 'all' || occurrenceFilter !== 'all' || searchStore || startDate || endDate;

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
          <h1 className="text-3xl font-bold tracking-tight">Relatórios de Visitas</h1>
          <p className="text-muted-foreground mt-1">Registro de auditoria de todas as visitas em lojas.</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/visits/new">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-end p-4 border rounded-md bg-muted/10">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={tempStatusFilter} onValueChange={setTempStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Finalizadas</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
              <SelectItem value="in_progress">Em andamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground">Ocorrências</label>
          <Select value={tempOccurrenceFilter} onValueChange={setTempOccurrenceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Com ocorrências</SelectItem>
              <SelectItem value="no">Sem ocorrências</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="text-xs font-medium text-muted-foreground">Buscar Loja</label>
          <Input 
            placeholder="Nome da loja..." 
            value={tempSearchStore}
            onChange={(e) => setTempSearchStore(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[130px]">
          <label className="text-xs font-medium text-muted-foreground">Data Inicial</label>
          <Input 
            type="date" 
            value={tempStartDate}
            onChange={(e) => setTempStartDate(e.target.value)}
          />
        </div>

        <div className="flex-1 min-w-[130px]">
          <label className="text-xs font-medium text-muted-foreground">Data Final</label>
          <Input 
            type="date" 
            value={tempEndDate}
            onChange={(e) => setTempEndDate(e.target.value)}
          />
        </div>

        <Button variant="default" size="sm" onClick={applyFilters} className="h-10 gap-2">
          <Search className="h-4 w-4" />
          Filtrar
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Contador de resultados */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground">
          {filteredVisits.length} {filteredVisits.length === 1 ? 'visita encontrada' : 'visitas encontradas'}
          {hasActiveFilters && ' (filtros aplicados)'}
        </div>
      )}

      <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Produtos</TableHead>
              <TableHead>Ocorrências</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <p>Nenhuma visita encontrada com os filtros aplicados.</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/visits/new">Iniciar sua primeira visita</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVisits.map((visit) => {
                if (!visit) return null;
                const isDraft = visit.status === 'draft';
                const items = itemsData[visit.id] || [];
                const itemsCount = items.length;
                const isLoadingItems = loadingItems[visit.id];
                
                const hasOcc = hasOccurrences(visit.id);
                const outOfStockCount = getOutOfStockCount(visit.id);
                const occurrenceCount = getOccurrenceCount(visit.id);

                return (
                  <TableRow key={visit.id} className={isDraft ? 'bg-muted/20' : ''}>
                    <TableCell>
                      {isDraft ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          📝 Rascunho
                        </Badge>
                      ) : visit.status === 'completed' ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          ✅ Finalizada
                        </Badge>
                      ) : visit.status === 'in_progress' ? (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          🔄 Em andamento
                        </Badge>
                      ) : (
                        <Badge variant="secondary">⏳ Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {safeFormatDate(visit.visited_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/stores/${visit.store_id}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {visit.store_name || 'Loja sem nome'}
                      </Link>
                      <div className="text-xs text-muted-foreground">{visit.store_city || ''}, {visit.store_state || ''}</div>
                    </TableCell>
                    <TableCell>
                      {isLoadingItems ? (
                        <Badge variant="secondary">Carregando...</Badge>
                      ) : (
                        <Badge variant="secondary">{itemsCount} itens</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isLoadingItems ? (
                        <span className="text-xs text-muted-foreground">Carregando...</span>
                      ) : hasOcc ? (
                        <div className="flex flex-wrap gap-1">
                          {outOfStockCount > 0 && (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 text-xs">
                              {outOfStockCount} F.E.
                            </Badge>
                          )}
                          {occurrenceCount > 0 && (
                            <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              {occurrenceCount} ocorrência{occurrenceCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Nenhuma</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-mono">
                          {getDuration(visit)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {isDraft ? (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/visits/${visit.id}`}>
                                <Edit className="h-4 w-4 mr-1" /> Continuar
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(visit.id, visit.status)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/visits/${visit.id}`}>
                                <Eye className="h-4 w-4 mr-1" /> Ver
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(visit.id, visit.status)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
