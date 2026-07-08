import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation } from "wouter";
import { useListStores, useListProducts, useCreateVisit, getListVisitsQueryKey, getGetRecentVisitsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, Trash2, Tag, Search } from "lucide-react";
import { Link, useSearch } from "wouter";
import { useToast } from "@/components/ui/use-toast";

const visitItemSchema = z.object({
  productId: z.number({ required_error: "Product is required" }),
  inStock: z.boolean(),
  price: z.coerce.number().nullable().optional(),
  shelfCondition: z.enum(["good", "regular", "bad"], { required_error: "Select shelf condition" }),
  notes: z.string().nullable().optional(),
});

const visitSchema = z.object({
  storeId: z.number({ required_error: "Store is required" }),
  visitedAt: z.string().min(1, "Date is required"),
  notes: z.string().nullable().optional(),
  items: z.array(visitItemSchema).min(1, "At least one product reading is required"),
});

type VisitFormValues = z.infer<typeof visitSchema>;

export default function NewVisit() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const initialStoreId = searchParams.get("storeId");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVisit = useCreateVisit();
  
  const { data: stores, isLoading: loadingStores } = useListStores();
  const { data: products, isLoading: loadingProducts } = useListProducts();

  const [productSearch, setProductSearch] = useState("");

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      storeId: initialStoreId ? Number(initialStoreId) : undefined,
      visitedAt: new Date().toISOString().substring(0, 16), // YYYY-MM-DDTHH:mm
      notes: "",
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleAddAllProducts = () => {
    if (!products) return;
    
    const existingProductIds = fields.map(f => f.productId);
    const productsToAdd = products.filter(p => !existingProductIds.includes(p.id));
    
    productsToAdd.forEach(p => {
      append({
        productId: p.id,
        inStock: true,
        price: null,
        shelfCondition: "good",
        notes: "",
      });
    });
  };

  const handleAddProduct = (productId: number) => {
    append({
      productId,
      inStock: true,
      price: null,
      shelfCondition: "good",
      notes: "",
    });
    setProductSearch("");
  };

  const onSubmit = (data: VisitFormValues) => {
    // ensure properly formatted datetime string
    const formattedData = {
      ...data,
      visitedAt: new Date(data.visitedAt).toISOString(),
      items: data.items.map(item => ({
        ...item,
        price: item.price ?? null,
        notes: item.notes ?? null,
      })),
    };

    createVisit.mutate(
      { data: formattedData },
      {
        onSuccess: (result) => {
          queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRecentVisitsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          toast({ description: "Visit recorded successfully" });
          setLocation(`/visits/${result.id}`);
        },
        onError: () => {
          toast({ variant: "destructive", description: "Failed to record visit" });
        }
      }
    );
  };

  const unaddedProducts = products?.filter(p => !fields.some(f => f.productId === p.id)) || [];
  const filteredUnaddedProducts = unaddedProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/visits">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Cancel Visit</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Record Visit</h1>
        <p className="text-muted-foreground mt-1">Audit store inventory and shelf conditions.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Visit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="storeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(Number(val))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger disabled={loadingStores}>
                            <SelectValue placeholder={loadingStores ? "Loading stores..." : "Select a store"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores?.map((store) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name} ({store.city})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visitedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>General Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any general observations about the store?" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Audit</CardTitle>
                <CardDescription>Record metrics for specific products during this visit.</CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddAllProducts} disabled={unaddedProducts.length === 0}>
                Add All Products
              </Button>
            </CardHeader>
            <CardContent>
              {form.formState.errors.items?.root && (
                <div className="text-sm font-medium text-destructive mb-4">
                  {form.formState.errors.items.root.message}
                </div>
              )}
              
              {fields.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-md bg-muted/20">
                  <p className="text-muted-foreground mb-4">No products added to this audit yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const product = products?.find(p => p.id === field.productId);
                    
                    return (
                      <Card key={field.id} className="overflow-visible border border-border/50">
                        <CardHeader className="py-3 px-4 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{product?.name || 'Unknown Product'}</h3>
                            <Badge variant="outline" className="text-xs bg-background">
                              {product?.category}
                            </Badge>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => remove(index)}
                            className="text-destructive h-8 w-8 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                            
                            <div className="md:col-span-2">
                              <FormField
                                control={form.control}
                                name={`items.${index}.inStock`}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-14">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-xs">In Stock</FormLabel>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Shelf Price ($)</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        step="0.01" 
                                        min="0" 
                                        placeholder="0.00" 
                                        {...field} 
                                        value={field.value ?? ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="md:col-span-3">
                              <FormField
                                control={form.control}
                                name={`items.${index}.shelfCondition`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Shelf Condition</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="good">Good</SelectItem>
                                        <SelectItem value="regular">Regular</SelectItem>
                                        <SelectItem value="bad">Bad</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <div className="md:col-span-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.notes`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-xs">Product Notes</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="Missing label, damaged box..." 
                                        {...field} 
                                        value={field.value || ''}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {unaddedProducts.length > 0 && (
                <div className="mt-6 border rounded-md p-4 bg-muted/10">
                  <h4 className="text-sm font-medium mb-3">Add Products to Audit</h4>
                  <div className="relative mb-3">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search products to add..." 
                      className="pl-8"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
                    {filteredUnaddedProducts.slice(0, 20).map(product => (
                      <Button 
                        key={product.id} 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleAddProduct(product.id)}
                        className="gap-1.5"
                      >
                        <Plus className="h-3 w-3" />
                        {product.name}
                      </Button>
                    ))}
                    {filteredUnaddedProducts.length > 20 && (
                      <span className="text-xs text-muted-foreground flex items-center px-2">
                        +{filteredUnaddedProducts.length - 20} more
                      </span>
                    )}
                    {filteredUnaddedProducts.length === 0 && (
                      <span className="text-sm text-muted-foreground italic">No products match your search.</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 sticky bottom-6 z-10 bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-lg">
            <Button type="button" variant="outline" asChild>
              <Link href="/visits">Cancel</Link>
            </Button>
            <Button type="submit" disabled={createVisit.isPending} className="gap-2">
              <Save className="h-4 w-4" />
              {createVisit.isPending ? "Saving..." : "Submit Visit Report"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
