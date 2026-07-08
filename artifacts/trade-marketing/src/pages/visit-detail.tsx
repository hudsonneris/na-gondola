import { useGetVisit, getGetVisitQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, MapPin, Calendar, Tag, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function VisitDetail() {
  const { id } = useParams();
  const visitId = Number(id);

  const { data: visit, isLoading } = useGetVisit(visitId, {
    query: { enabled: !!visitId, queryKey: getGetVisitQueryKey(visitId) }
  });

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
    return <div className="p-10 text-center">Visit report not found.</div>;
  }

  const outOfStockCount = visit.items.filter(i => !i.inStock).length;
  const poorShelfCount = visit.items.filter(i => i.shelfCondition === 'bad').length;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/visits">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-sm font-medium text-muted-foreground">Back to Visits</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  {visit.storeName}
                </CardTitle>
                <p className="text-muted-foreground mt-1 flex items-center gap-1">
                  {visit.storeCity}, {visit.storeState} • <Badge variant="secondary" className="ml-1 text-xs">{visit.storeChannel}</Badge>
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 font-mono text-sm bg-accent px-3 py-1.5 rounded-md">
                  <Calendar className="h-4 w-4" />
                  {format(parseISO(visit.visitedAt), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          </CardHeader>
          {visit.notes && (
            <CardContent className="pt-0 border-t">
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Field Notes</h4>
                <p className="text-sm">{visit.notes}</p>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex flex-row md:flex-col gap-4 w-full md:w-48">
          <Card className="flex-1 bg-card">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <span className="text-4xl font-bold text-primary font-mono">{visit.items.length}</span>
              <span className="text-xs uppercase font-bold text-muted-foreground mt-1">Products</span>
            </CardContent>
          </Card>
          <Card className="flex-1 border-destructive bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
              <span className="text-3xl font-bold text-destructive font-mono">{outOfStockCount}</span>
              <span className="text-xs uppercase font-bold text-destructive/80 mt-1">OOS</span>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          Product Audit Data
        </h3>
        
        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Stock Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Shelf Condition</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visit.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" /> {item.productCategory}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {item.inStock ? (
                      <Badge variant="success" className="bg-green-100 text-green-800 border-transparent hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" /> In Stock
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" /> Out of Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {item.price ? `$${item.price.toFixed(2)}` : <span className="text-muted-foreground opacity-50">-</span>}
                  </TableCell>
                  <TableCell>
                    {item.shelfCondition === 'good' ? (
                      <Badge variant="outline" className="border-green-500 text-green-700">Good</Badge>
                    ) : item.shelfCondition === 'regular' ? (
                      <Badge variant="outline" className="border-blue-500 text-blue-700">Regular</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">Bad</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={item.notes || ''}>
                    {item.notes || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
