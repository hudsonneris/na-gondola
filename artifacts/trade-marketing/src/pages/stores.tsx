import { useState } from "react";
import { useListStores, useCreateStore, useUpdateStore, useDeleteStore, getListStoresQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, MapPin, Edit, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";

const storeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  channel: z.string().min(1, "Channel is required"),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function Stores() {
  const [search, setSearch] = useState("");
  const { data: stores, isLoading } = useListStores();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();
  const deleteStore = useDeleteStore();

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: "", city: "", state: "", channel: "" },
  });

  const filteredStores = stores?.filter((store) => 
    store.name.toLowerCase().includes(search.toLowerCase()) || 
    store.city.toLowerCase().includes(search.toLowerCase())
  );

  const openNewStoreDialog = () => {
    form.reset({ name: "", city: "", state: "", channel: "" });
    setEditingStoreId(null);
    setIsDialogOpen(true);
  };

  const openEditStoreDialog = (store: any) => {
    form.reset({
      name: store.name,
      city: store.city,
      state: store.state,
      channel: store.channel,
    });
    setEditingStoreId(store.id);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: StoreFormValues) => {
    if (editingStoreId) {
      updateStore.mutate(
        { id: editingStoreId, data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListStoresQueryKey() });
            setIsDialogOpen(false);
            toast({ description: "Store updated successfully" });
          },
        }
      );
    } else {
      createStore.mutate(
        { data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListStoresQueryKey() });
            setIsDialogOpen(false);
            toast({ description: "Store created successfully" });
          },
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this store?")) {
      deleteStore.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListStoresQueryKey() });
            toast({ description: "Store deleted" });
          },
        }
      );
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stores</h1>
          <p className="text-muted-foreground mt-1">Manage retail locations and channels.</p>
        </div>
        <Button onClick={openNewStoreDialog} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search stores by name or city..." 
          className="pl-9 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredStores?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No stores found.
                </TableCell>
              </TableRow>
            ) : (
              filteredStores?.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">
                    <Link href={`/stores/${store.id}`} className="hover:underline text-primary">
                      {store.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-muted-foreground text-sm gap-1">
                      <MapPin className="h-3 w-3" />
                      {store.city}, {store.state}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{store.channel}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditStoreDialog(store)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStoreId ? "Edit Store" : "Add Store"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Target Downtown" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chicago" {...field} />
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
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. IL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Grocery, Pharmacy, Convenience" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createStore.isPending || updateStore.isPending}>
                  {editingStoreId ? "Save Changes" : "Create Store"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
