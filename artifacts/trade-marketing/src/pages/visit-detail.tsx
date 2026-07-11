import { useGetVisit, getGetVisitQueryKey, useUpdateVisit, useDeleteVisit } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, MapPin, Calendar, Tag, CheckCircle, XCircle, Edit, Save, Lock, Clock, Plus, Trash2, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useListProducts } from "@workspace/api-client-react";

const SUPPLY_STATUS_OPTIONS = [
  "Organizado",
  "Abastecido",
  "Regular",
  "Bem posicionado",
  "Completo",
  "Fora de estoque",
  "Vencido",
  "Danificado",
  "Sem etiqueta",
  "Preço errado",
  "Mal posicionado",
];

export default function VisitDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const visitId = Number(id);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: visit, isLoading } = useGetVisit(visitId, {
    query: { enabled: !!visitId, queryKey: getGetVisitQueryKey(visitId) }
  });

  const { data: products } = useListProducts();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateVisit = useUpdateVisit();
  const deleteVisit = useDeleteVisit();

  const [editedVisit, setEditedVisit] = useState<any>(null);
  const [editedItems, setEditedItems] = useState<any[]>([]);

  // 🔥 CORREÇÃO: Usar useEffect com dependências corretas
  useEffect(() => {
    if (visit && !editedVisit) {
      setEditedVisit({ ...visit });
      setEditedItems(visit.items.map((item: any) => ({ ...item })));
    }
  }, [visit]); // 🔥 Só executa quando 'visit' muda

  const handleFinish = () => {
    if (confirm("Tem certeza que deseja finalizar esta visita? Após finalizada, não será mais possível editar.")) {
      fetch(`/api/visits/${visitId}/finish`, { method: 'POST' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(visitId) });
          toast({ description: "Visita finalizada com sucesso!" });
          setIsEditing(false);
        })
        .catch(() => {
          toast({ variant: "destructive", description: "Erro ao finalizar visita" });
        });
    }
  };

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir esta visita?")) {
      deleteVisit.mutate(
        { id: visitId },
        {
          onSuccess: () => {
            toast({ description: "Visita excluída com sucesso" });
            setLocation("/visits");
          },
        }
      );
    }
  };

  const handleSave = () => {
    if (!editedVisit) return;

    const data = {
      storeId: editedVisit.storeId,
      visitedAt: editedVisit.visitedAt,
      notes: editedVisit.notes || null,
      checkIn: editedVisit.checkIn || null,
      checkOut: editedVisit.checkOut || null,
      status: editedVisit.status || "pending",
      items: editedItems.map(item => ({
        productId: item.productId,
        inStock: item.inStock,
        price: item.price ? parseFloat(item.price) : null,
        notes: item.notes || null,
        supplyStatus: item.supplyStatus || [],
      })),
    };

    updateVisit.mutate(
      { id: visitId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(visitId) });
          toast({ description: "Visita atualizada com sucesso!" });
          setIsEditing(false);
          setEditedVisit(null);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Erro ao salvar alterações" });
        },
      }
    );
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    if (editedItems.some(item => item.productId === selectedProductId)) {
      toast({ description: "Produto já adicionado" });
      return;
    }

    setEditedItems([
      ...editedItems,
      {
        id: `temp-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        productCategory: product.category || product.categoryName,
        inStock: true,
        price: null,
        notes: null,
        supplyStatus: [],
      },
    ]);
    setSelectedProductId(null);
    setShowAddProduct(false);
    toast({ description: "Produto adicionado!" });
  };

  const handleRemoveItem = (index: number) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      const newItems = [...editedItems];
      newItems.splice(index, 1);
      setEditedItems(newItems);
      toast({ description: "Produto removido!" });
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const isCompleted = visit?.status === "completed";
  const outOfStockCount = (isEditing ? editedItems : visit?.items)?.filter((i: any) => !i.inStock).length || 0;

  const formatDuration = (minutes: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full mt-8" />
      </div>
    );
  }

  if (!visit) {
    return <div className="p-10 text-center">Relatório de visita não encontrado.</div>;
  }

  const displayItems = isEditing ? editedItems : visit.items;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/visits">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Voltar para Visitas</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isCompleted && (
            <>
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditedVisit({ ...visit });
                    setEditedItems(visit.items.map((item: any) => ({ ...item })));
                    setIsEditing(true);
                  }}>
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="default" size="sm" onClick={handleFinish}>
                    <Lock className="h-4 w-4 mr-1" /> Finalizar
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(false);
                    setEditedVisit(null);
                  }}>
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" /> Salvar
                  </Button>
                </>
              )}
            </>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  {visit.storeName}
                </CardTitle>
                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                  {visit.storeCity}, {visit.storeState} • <Badge variant="secondary" className="ml-1 text-xs">{visit.storeChannel}</Badge>
                </p>
                {visit.networkName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rede: {visit.networkName}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 font-mono text-sm bg-accent px-3 py-1.5 rounded-md">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(visit.visitedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
                <Badge 
                  className="mt-2"
                  variant={isCompleted ? "default" : "warning"}
                >
                  {isCompleted ? "✅ Finalizada" : visit.status === 'draft' ? "📝 Rascunho" : "🔄 Em andamento"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 border-t">
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Observações de Campo</h4>
              {isEditing ? (
                <Textarea 
                  value={editedVisit?.notes || ''}
                  onChange={(e) => setEditedVisit({ ...editedVisit, notes: e.target.value })}
                  className="min-h-[100px]"
                  placeholder="Digite as observações..."
                />
              ) : (
                <p className="text-sm">{visit.notes || 'Nenhuma observação'}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-row md:flex-col gap-4 w-full md:w-48">
          <Card className="flex-1 bg-card">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <span className="text-4xl font-bold text-primary font-mono">{displayItems?.length || 0}</span>
              <span className="text-xs uppercase font-bold text-muted-foreground mt-1">Produtos</span>
            </CardContent>
          </Card>
          <Card className="flex-1 border-destructive bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <span className="text-3xl font-bold text-destructive font-mono">{outOfStockCount}</span>
              <span className="text-xs uppercase font-bold text-destructive/80 mt-1">F.E.</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {(visit.checkIn || visit.checkOut) && (
        <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg">
          {visit.checkIn && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Entrada:</span>
              <span className="font-mono font-medium">
                {format(parseISO(visit.checkIn), 'HH:mm')}
              </span>
            </div>
          )}
          {visit.checkOut && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-muted-foreground">Saída:</span>
              <span className="font-mono font-medium">
                {format(parseISO(visit.checkOut), 'HH:mm')}
              </span>
            </div>
          )}
          {visit.durationMinutes && (
            <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-muted-foreground">Duração:</span>
              <span className="font-mono font-bold text-primary">
                {formatDuration(visit.durationMinutes)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold flex items-center gap-2">
            Dados da Auditoria de Produtos
          </h3>
          {isEditing && !isCompleted && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddProduct(!showAddProduct)}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar Produto
              </Button>
            </div>
          )}
        </div>

        {showAddProduct && isEditing && (
          <div className="mb-4 p-4 border rounded-md bg-muted/20">
            <div className="flex gap-2">
              <Select onValueChange={(val) => setSelectedProductId(Number(val))}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - {product.category || product.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddProduct}>Adicionar</Button>
              <Button variant="ghost" onClick={() => setShowAddProduct(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Status do Estoque</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status do Abastecimento</TableHead>
                <TableHead>Observações</TableHead>
                {isEditing && !isCompleted && <TableHead className="text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayItems?.map((item: any, index: number) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {item.productCategory || item.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing && !isCompleted ? (
                      <div className="flex justify-center">
                        <Switch
                          checked={item.inStock}
                          onCheckedChange={(checked) => handleItemChange(index, 'inStock', checked)}
                        />
                      </div>
                    ) : (
                      item.inStock ? (
                        <Badge variant="success" className="bg-green-100 text-green-800 border-transparent hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" /> Em Estoque
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                          <XCircle className="h-3 w-3 mr-1" /> Fora de Estoque
                        </Badge>
                      )
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {isEditing && !isCompleted ? (
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(index, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                        className="w-24"
                      />
                    ) : (
                      item.price ? `R$ ${item.price.toFixed(2)}` : <span className="text-muted-foreground opacity-50">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && !isCompleted ? (
                      <div className="flex flex-wrap gap-1">
                        {SUPPLY_STATUS_OPTIONS.map((status) => {
                          const checked = item.supplyStatus?.includes(status);
                          const isPositive = ["Organizado", "Abastecido", "Regular", "Bem posicionado", "Completo"].includes(status);

                          return (
                            <label
                              key={status}
                              className={`
                                flex items-center gap-1 text-xs border rounded px-2 py-0.5 cursor-pointer hover:bg-muted/50 transition-colors
                                ${checked && isPositive ? 'bg-green-50 border-green-500 text-green-700' : ''}
                                ${checked && !isPositive ? 'bg-red-50 border-red-500 text-red-700' : ''}
                                ${!checked ? 'border-border hover:border-muted-foreground' : ''}
                              `}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const current = item.supplyStatus || [];
                                  if (e.target.checked) {
                                    handleItemChange(index, 'supplyStatus', [...current, status]);
                                  } else {
                                    handleItemChange(index, 'supplyStatus', current.filter((s: string) => s !== status));
                                  }
                                }}
                                className="h-3 w-3 rounded border-gray-300"
                              />
                              {status}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {item.supplyStatus?.map((status: string) => {
                          const isPositive = ["Organizado", "Abastecido", "Regular", "Bem posicionado", "Completo"].includes(status);
                          return (
                            <Badge 
                              key={status} 
                              variant="outline" 
                              className={isPositive ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50'}
                            >
                              {status}
                            </Badge>
                          );
                        })}
                        {(!item.supplyStatus || item.supplyStatus.length === 0) && '-'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && !isCompleted ? (
                      <Input 
                        placeholder="Observações..."
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        className="min-w-[100px]"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{item.notes || '-'}</span>
                    )}
                  </TableCell>
                  {isEditing && !isCompleted && (
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveItem(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {displayItems?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isEditing && !isCompleted ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    Nenhum produto adicionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}