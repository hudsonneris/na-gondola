import { useGetVisit, getGetVisitQueryKey, useUpdateVisit, useDeleteVisit } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, MapPin, Calendar, Tag, CheckCircle, XCircle, Edit, Save, Lock, Clock, Plus, Trash2, X, ZoomIn, Download } from "lucide-react";
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
  "Organizado", "Abastecido", "Regular", "Bem posicionado", "Completo",
  "Fora de estoque", "Vencido", "Danificado", "Sem etiqueta", "Preço errado", "Mal posicionado"
];

const safeFormatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy");
  } catch { return "-"; }
};

const safeFormatDateTime = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm");
  } catch { return "-"; }
};

const safeFormatDateFull = (dateStr: string) => {
  if (!dateStr) return "-";
  try {
    return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch { return "-"; }
};

const safeFormatCurrency = (value: any) => {
  if (!value) return "-";
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return `R$ ${num.toFixed(2)}`;
};

export default function VisitDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const visitId = Number(id);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

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

  useEffect(() => {
    if (visit && !editedVisit) {
      setEditedVisit({ ...visit });
      setEditedItems(visit.items?.map((item: any) => ({ ...item })) || []);
    }
  }, [visit]);

  const handleFinish = () => {
    if (confirm("Tem certeza que deseja finalizar esta visita?")) {
      fetch(`/api/visits/${visitId}/finish`, { method: 'POST' })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(visitId) });
          toast({ description: "Visita finalizada!" });
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
            toast({ description: "Visita excluída" });
            setLocation("/visits");
          },
        }
      );
    }
  };

  const handleSave = () => {
    if (!editedVisit) return;

    const data = {
      storeId: editedVisit.store_id,
      visitedAt: editedVisit.visited_at,
      notes: editedVisit.notes || null,
      checkIn: editedVisit.check_in || null,
      checkOut: editedVisit.check_out || null,
      status: editedVisit.status || "pending",
      photoBefore: editedVisit.photo_before || null,
      photoAfter: editedVisit.photo_after || null,
      items: editedItems.map(item => ({
        productId: item.product_id,
        inStock: item.in_stock,
        price: item.price ? parseFloat(item.price) : null,
        notes: item.notes || null,
        supplyStatus: item.supply_status || [],
      })),
    };

    updateVisit.mutate(
      { id: visitId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetVisitQueryKey(visitId) });
          toast({ description: "Visita atualizada!" });
          setIsEditing(false);
          setEditedVisit(null);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Erro ao salvar" });
        },
      }
    );
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const product = products?.find(p => p.id === selectedProductId);
    if (!product) return;

    if (editedItems.some(item => item.product_id === selectedProductId)) {
      toast({ description: "Produto já adicionado" });
      return;
    }

    setEditedItems([
      ...editedItems,
      {
        id: `temp-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        product_category: product.category || product.categoryName,
        in_stock: true,
        price: null,
        notes: null,
        supply_status: [],
      },
    ]);
    setSelectedProductId(null);
    setShowAddProduct(false);
    toast({ description: "Produto adicionado!" });
  };

  const handleRemoveItem = (index: number) => {
    if (confirm("Remover este produto?")) {
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
  const outOfStockCount = (isEditing ? editedItems : visit?.items)?.filter((i: any) => i?.in_stock === false).length || 0;

  const formatDuration = (minutes: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_${new Date().toISOString().slice(0,10)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    return <div className="p-10 text-center">Visita não encontrada.</div>;
  }

  const displayItems = isEditing ? editedItems : (visit.items || []);

  const PhotoWithOverlay = ({ url, label, type }: { url: string; label: string; type: 'ANTES' | 'DEPOIS' }) => (
    <div className="relative group">
      <div className="relative overflow-hidden rounded border bg-black/5">
        <img
          src={url}
          alt={label}
          className="w-full max-h-48 object-cover cursor-zoom-in transition-transform duration-300 group-hover:scale-105"
          onClick={() => setLightboxImage(url)}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div class="flex items-center justify-center h-48 bg-muted text-muted-foreground">
                <span class="text-sm">Imagem não disponível</span>
              </div>
            `;
          }}
        />
        {/* 🔥 Overlay com metadados na imagem */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="text-white">
            <div className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {visit.store_name || 'Loja'}
            </div>
            <div className="text-xs text-white/80 flex items-center gap-2 mt-0.5">
              <Calendar className="h-3 w-3" />
              {visit.visited_at ? format(parseISO(visit.visited_at), "dd/MM/yyyy HH:mm") : ''}
            </div>
            <div className="text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded bg-black/50">
              {type}
            </div>
          </div>
        </div>
        {/* 🔥 Botões Zoom e Download */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            className="bg-black/70 text-white p-1.5 rounded hover:bg-black/90"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(url);
            }}
            title="Zoom"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            className="bg-black/70 text-white p-1.5 rounded hover:bg-black/90"
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(url, `${type.toLowerCase()}_${visit.store_name || 'visita'}`);
            }}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Zoom"
            className="max-w-[90vw] max-h-[90vh] object-contain"
          />
          <button
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            onClick={() => setLightboxImage(null)}
          >
            ✕
          </button>
          <button
            className="absolute bottom-4 right-4 bg-white/20 text-white px-4 py-2 rounded hover:bg-white/30"
            onClick={(e) => {
              e.stopPropagation();
              downloadImage(lightboxImage, 'visita');
            }}
          >
            ⬇️ Download
          </button>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/visits">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Voltar</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isCompleted && (
            <>
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditedVisit({ ...visit });
                    setEditedItems(visit.items?.map((item: any) => ({ ...item })) || []);
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
                  {visit.store_name || 'Loja sem nome'}
                </CardTitle>
                <div className="text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                  <span>{visit.store_city || ''}, {visit.store_state || ''}</span>
                  <Badge variant="secondary" className="text-xs">{visit.store_channel || ''}</Badge>
                </div>
                {visit.network_name && (
                  <div className="text-xs text-muted-foreground mt-0.5">Rede: {visit.network_name}</div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 font-mono text-sm bg-accent px-3 py-1.5 rounded-md">
                  <Calendar className="h-4 w-4" />
                  {safeFormatDateFull(visit.visited_at)}
                </div>
                <Badge className="mt-2" variant={isCompleted ? "default" : "warning"}>
                  {isCompleted ? "✅ Finalizada" : visit.status === 'draft' ? "📝 Rascunho" : "🔄 Em andamento"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 border-t">
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Observações</h4>
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

            {/* 🔥 Fotos com metadados */}
            {(visit.photo_before || visit.photo_after) && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Registro Fotográfico</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visit.photo_before && (
                    <PhotoWithOverlay url={visit.photo_before} label="ANTES" type="ANTES" />
                  )}
                  {visit.photo_after && (
                    <PhotoWithOverlay url={visit.photo_after} label="DEPOIS" type="DEPOIS" />
                  )}
                </div>
              </div>
            )}
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

      {(visit.check_in || visit.check_out) && (
        <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg">
          {visit.check_in && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Entrada:</span>
              <span className="font-mono font-medium">{safeFormatDateTime(visit.check_in)}</span>
            </div>
          )}
          {visit.check_out && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-muted-foreground">Saída:</span>
              <span className="font-mono font-medium">{safeFormatDateTime(visit.check_out)}</span>
            </div>
          )}
          {visit.duration_minutes && (
            <div className="flex items-center gap-2 text-sm bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-muted-foreground">Duração:</span>
              <span className="font-mono font-bold text-primary">{formatDuration(visit.duration_minutes)}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-xl font-bold flex items-center gap-2">Dados da Auditoria</h3>
          {isEditing && !isCompleted && (
            <Button variant="outline" size="sm" onClick={() => setShowAddProduct(!showAddProduct)}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar Produto
            </Button>
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
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Abastecimento</TableHead>
                <TableHead>Obs.</TableHead>
                {isEditing && !isCompleted && <TableHead className="text-center">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayItems?.map((item: any, index: number) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">{item.product_name || 'Produto'}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {item.product_category || 'Sem categoria'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditing && !isCompleted ? (
                      <div className="flex justify-center">
                        <Switch
                          checked={item.in_stock}
                          onCheckedChange={(checked) => handleItemChange(index, 'in_stock', checked)}
                        />
                      </div>
                    ) : (
                      item.in_stock ? (
                        <Badge variant="success" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" /> Em Estoque
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" /> F.E.
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
                        className="w-20"
                      />
                    ) : (
                      safeFormatCurrency(item.price)
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && !isCompleted ? (
                      <div className="flex flex-wrap gap-1">
                        {SUPPLY_STATUS_OPTIONS.map((status) => {
                          const checked = item.supply_status?.includes(status);
                          const isPositive = ["Organizado","Abastecido","Regular","Bem posicionado","Completo"].includes(status);
                          return (
                            <label
                              key={status}
                              className={`text-xs border rounded px-2 py-0.5 cursor-pointer hover:bg-muted/50 ${checked && isPositive ? 'bg-green-50 border-green-500' : ''} ${checked && !isPositive ? 'bg-red-50 border-red-500' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const current = item.supply_status || [];
                                  if (e.target.checked) {
                                    handleItemChange(index, 'supply_status', [...current, status]);
                                  } else {
                                    handleItemChange(index, 'supply_status', current.filter((s: string) => s !== status));
                                  }
                                }}
                                className="h-3 w-3 mr-1"
                              />
                              {status}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {item.supply_status?.map((status: string) => {
                          const isPositive = ["Organizado","Abastecido","Regular","Bem posicionado","Completo"].includes(status);
                          return (
                            <Badge key={status} variant="outline" className={isPositive ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50'}>
                              {status}
                            </Badge>
                          );
                        })}
                        {(!item.supply_status || item.supply_status.length === 0) && '-'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && !isCompleted ? (
                      <Input
                        placeholder="Obs."
                        value={item.notes || ''}
                        onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                        className="min-w-[80px]"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{item.notes || '-'}</span>
                    )}
                  </TableCell>
                  {isEditing && !isCompleted && (
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="text-destructive">
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
