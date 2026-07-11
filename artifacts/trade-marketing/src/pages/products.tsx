import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit, Trash2, Tag, Image as ImageIcon, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  brand: string | null;
  sku: string | null;
  stock: number;
  imageUrl: string | null;
}

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  categoryId: z.number().min(1, "Categoria é obrigatória"),
  brand: z.string().optional(),
  sku: z.string().optional(),
  stock: z.coerce.number().min(0, "Estoque não pode ser negativo").default(0),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function Products() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { 
      name: "", 
      categoryId: undefined,
      brand: "", 
      sku: "", 
      stock: 0, 
      imageUrl: "" 
    },
  });

  const fetchData = async () => {
    try {
      // Buscar categorias
      const categoriesRes = await fetch('/api/categories');
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }

      // Buscar produtos
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      } else {
        toast({ variant: "destructive", description: "Erro ao carregar produtos" });
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

  const filteredProducts = products?.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.categoryName && p.categoryName.toLowerCase().includes(search.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
  );

  const openNewProductDialog = () => {
    form.reset({ name: "", categoryId: undefined, brand: "", sku: "", stock: 0, imageUrl: "" });
    setEditingProductId(null);
    setIsDialogOpen(true);
  };

  const openEditProductDialog = (product: Product) => {
    form.reset({
      name: product.name,
      categoryId: product.categoryId || undefined,
      brand: product.brand || "",
      sku: product.sku || "",
      stock: product.stock || 0,
      imageUrl: product.imageUrl || "",
    });
    setEditingProductId(product.id);
    setIsDialogOpen(true);
  };

  // 🔥 Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'product');
      formData.append('productId', editingProductId?.toString() || 'new');

      const response = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        form.setValue('imageUrl', data.url);
        toast({ description: "Imagem enviada com sucesso!" });
      } else {
        toast({ variant: "destructive", description: "Erro ao enviar imagem" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao enviar imagem" });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({ description: editingProductId ? "Produto atualizado com sucesso" : "Produto criado com sucesso" });
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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) return;

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ description: "Produto excluído" });
        fetchData();
      } else {
        toast({ variant: "destructive", description: "Erro ao excluir" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao excluir" });
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground mt-1">Gerencie o catálogo mestre de produtos.</p>
        </div>
        <Button onClick={openNewProductDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar produtos por nome, marca ou categoria..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-center">Estoque</TableHead>
              <TableHead className="text-center">Foto</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {search ? "Nenhum produto encontrado para esta busca." : "Nenhum produto cadastrado."}
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brand || <span className="text-muted-foreground text-xs">-</span>}</TableCell>
                  <TableCell className="font-mono text-xs">{product.sku || <span className="text-muted-foreground text-xs">-</span>}</TableCell>
                  <TableCell>
                    {product.categoryName ? (
                      <Badge variant="secondary" className="flex w-fit items-center gap-1 font-mono text-xs">
                        <Tag className="h-3 w-3" />
                        {product.categoryName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                      {product.stock || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="h-10 w-10 object-cover rounded mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center mx-auto">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditProductDialog(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id, product.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProductId ? "Editar Produto" : "Adicionar Produto"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Nome do Produto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Energy Drink 250ml" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Categoria *</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          <option value="">Selecione uma categoria...</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
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
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Coca-Cola" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código (SKU)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: REF-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade em Estoque</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Foto do Produto</FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="https://exemplo.com/foto.jpg" 
                              {...field}
                              className="flex-1"
                            />
                            <div className="relative">
                              <Button 
                                type="button" 
                                variant="outline"
                                disabled={uploading}
                                onClick={() => document.getElementById('image-upload')?.click()}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                {uploading ? "Enviando..." : "Upload"}
                              </Button>
                              <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </div>
                          </div>
                          {form.watch('imageUrl') && (
                            <img 
                              src={form.watch('imageUrl')} 
                              alt="Preview" 
                              className="h-32 w-32 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">
                  {editingProductId ? "Salvar Alterações" : "Criar Produto"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}