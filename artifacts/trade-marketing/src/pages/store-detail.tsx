import { useParams, Link } from "wouter";
import { useGetStore, useListVisits, getGetStoreQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ArrowLeft, Clock, Package } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function StoreDetail() {
  const { id } = useParams();
  const storeId = Number(id);

  const { data: store, isLoading: loadingStore } = useGetStore(storeId, {
    query: { enabled: !!storeId, queryKey: getGetStoreQueryKey(storeId) }
  });

  const { data: visits, isLoading: loadingVisits } = useListVisits();
  
  const storeVisits = visits?.filter(v => v.storeId === storeId).sort((a, b) => 
    new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
  );

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/stores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Back to Stores</span>
      </div>

      {loadingStore ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-1/4" />
        </div>
      ) : store ? (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{store.name}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <div className="flex items-center text-muted-foreground gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{store.city}, {store.state}</span>
              </div>
              <Badge variant="secondary" className="uppercase font-bold tracking-wider">{store.channel}</Badge>
            </div>
          </div>
          <Button asChild>
            <Link href={`/visits/new?storeId=${store.id}`}>Record New Visit</Link>
          </Button>
        </div>
      ) : (
        <div>Store not found.</div>
      )}

      <div className="pt-6">
        <h2 className="text-xl font-bold mb-4">Visit History</h2>
        
        {loadingVisits ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : storeVisits?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-4 opacity-20" />
              <p>No visits recorded for this store yet.</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/visits/new?storeId=${store?.id}`}>Be the first to visit</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {storeVisits?.map(visit => {
              // We need to calculate some stats from the visit detail if possible
              // The list endpoint returns items array so we can process it
              const outOfStockCount = visit.items.filter(i => !i.inStock).length;
              const poorShelfCount = visit.items.filter(i => i.shelfCondition === 'bad').length;
              
              return (
                <Card key={visit.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="bg-muted p-6 flex flex-col items-center justify-center min-w-32 border-b sm:border-b-0 sm:border-r">
                        <span className="text-sm font-bold uppercase text-muted-foreground tracking-widest">
                          {format(parseISO(visit.visitedAt), 'MMM')}
                        </span>
                        <span className="text-3xl font-black font-mono mt-1">
                          {format(parseISO(visit.visitedAt), 'dd')}
                        </span>
                        <span className="text-xs text-muted-foreground mt-2 font-mono">
                          {format(parseISO(visit.visitedAt), 'yyyy')}
                        </span>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                              <Package className="h-5 w-5 text-primary" />
                              {visit.items.length} Products Checked
                            </h3>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/visits/${visit.id}`}>View Details</Link>
                            </Button>
                          </div>
                          
                          {visit.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2 italic border-l-2 pl-3">
                              "{visit.notes}"
                            </p>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          {outOfStockCount > 0 && (
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              {outOfStockCount} Out of Stock
                            </Badge>
                          )}
                          {poorShelfCount > 0 && (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
                              {poorShelfCount} Poor Shelf Conditions
                            </Badge>
                          )}
                          {outOfStockCount === 0 && poorShelfCount === 0 && (
                            <Badge variant="success" className="bg-green-100 text-green-800">
                              Perfect Visit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
