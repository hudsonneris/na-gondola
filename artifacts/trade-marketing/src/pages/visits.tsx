import { useListVisits, useDeleteVisit, getListVisitsQueryKey, getGetRecentVisitsQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Eye, MapPin, Calendar } from "lucide-react";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function Visits() {
  const { data: visits, isLoading } = useListVisits();
  const deleteVisit = useDeleteVisit();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const sortedVisits = visits ? [...visits].sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()) : [];

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this visit report?")) {
      deleteVisit.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetRecentVisitsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
            toast({ description: "Visit deleted successfully" });
          },
        }
      );
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visit Reports</h1>
          <p className="text-muted-foreground mt-1">Audit log of all store field visits.</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/visits/new">
            <Plus className="h-4 w-4" />
            New Visit
          </Link>
        </Button>
      </div>

      <div className="border rounded-md bg-card flex-1 overflow-hidden flex flex-col">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Issues</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : sortedVisits?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <p>No visits recorded.</p>
                    <Button variant="link" asChild className="mt-2">
                      <Link href="/visits/new">Start your first visit</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedVisits?.map((visit) => {
                const outOfStockCount = visit.items.filter(i => !i.inStock).length;
                const poorShelfCount = visit.items.filter(i => i.shelfCondition === 'bad').length;
                
                return (
                  <TableRow key={visit.id}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(parseISO(visit.visitedAt), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/stores/${visit.storeId}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {visit.storeName}
                      </Link>
                      <div className="text-xs text-muted-foreground">{visit.storeCity}, {visit.storeState}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{visit.items.length} items</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {outOfStockCount > 0 && (
                          <Badge variant="destructive" className="bg-red-100 text-red-800 border-transparent text-[10px] px-1.5 py-0 h-5">
                            {outOfStockCount} OOS
                          </Badge>
                        )}
                        {poorShelfCount > 0 && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50 text-[10px] px-1.5 py-0 h-5">
                            {poorShelfCount} Poor Shelf
                          </Badge>
                        )}
                        {outOfStockCount === 0 && poorShelfCount === 0 && (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/visits/${visit.id}`}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(visit.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
