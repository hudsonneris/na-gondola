import { useGetDashboardSummary, useGetOutOfStockReport, useGetPoorShelfReport, useGetRecentVisits } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { Store, Package, MapPin, AlertTriangle, AlertCircle, Clock, Plus } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: oosReport, isLoading: loadingOOS } = useGetOutOfStockReport();
  const { data: poorShelfReport, isLoading: loadingShelf } = useGetPoorShelfReport();
  const { data: recentVisits, isLoading: loadingVisits } = useGetRecentVisits();

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* ✅ ADICIONADO: Botão Nova Visita */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">Resumo das operações de campo em um relance.</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
          <Link href="/visits/new">
            <Plus className="h-4 w-4" />
            Nova Visita
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard 
          title="Total de Lojas" 
          value={summary?.totalStores} 
          icon={<Store className="h-5 w-5 text-muted-foreground" />} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Total de Produtos" 
          value={summary?.totalProducts} 
          icon={<Package className="h-5 w-5 text-muted-foreground" />} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Total de Visitas" 
          value={summary?.totalVisits} 
          icon={<MapPin className="h-5 w-5 text-muted-foreground" />} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Fora de Estoque" 
          value={summary?.outOfStockCount} 
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />} 
          loading={loadingSummary}
          valueClassName="text-destructive"
        />
        <SummaryCard 
          title="Condição Ruim de Gondola" 
          value={summary?.poorShelfCount} 
          icon={<AlertCircle className="h-5 w-5 text-yellow-500" />} 
          loading={loadingSummary}
        />
        <SummaryCard 
          title="Visitas Esta Semana" 
          value={summary?.visitsThisWeek} 
          icon={<Clock className="h-5 w-5 text-muted-foreground" />} 
          loading={loadingSummary} 
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Problemas de Falta de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOOS ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : oosReport?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum problema de falta de estoque reportado.</p>
            ) : (
              <div className="space-y-4">
                {oosReport?.slice(0, 5).map((item) => (
                  <div key={`${item.visitId}-${item.productId}`} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-sm">{item.productName}</p>
                      <Link href={`/stores/${item.storeId}`} className="text-sm text-muted-foreground hover:underline">
                        {item.storeName} ({item.storeCity})
                      </Link>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {format(parseISO(item.visitedAt), 'MMM d')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Condições Ruins de Gondola
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingShelf ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : poorShelfReport?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma condição ruim de gondola reportada.</p>
            ) : (
              <div className="space-y-4">
                {poorShelfReport?.slice(0, 5).map((item) => (
                  <div key={`${item.visitId}-${item.productId}`} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-sm">{item.productName}</p>
                      <Link href={`/stores/${item.storeId}`} className="text-sm text-muted-foreground hover:underline">
                        {item.storeName}
                      </Link>
                    </div>
                    <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200">
                      {item.shelfCondition === "good" ? "Boa" : 
                       item.shelfCondition === "regular" ? "Regular" : "Ruim"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Visitas Recentes</span>
            <Link href="/visits" className="text-sm font-normal text-primary hover:underline">Ver todas</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingVisits ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : recentVisits?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma visita recente.</p>
          ) : (
            <div className="space-y-4">
              {recentVisits?.slice(0, 5).map((visit) => (
                <div key={visit.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="bg-accent rounded-md p-3 flex flex-col items-center justify-center min-w-16">
                      <span className="text-xs font-bold uppercase text-muted-foreground">{format(parseISO(visit.visitedAt), 'MMM')}</span>
                      <span className="text-lg font-bold leading-none">{format(parseISO(visit.visitedAt), 'd')}</span>
                    </div>
                    <div>
                      <Link href={`/visits/${visit.id}`} className="font-semibold hover:underline">
                        {visit.storeName}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs font-normal">
                          {visit.itemCount} itens
                        </Badge>
                        {visit.outOfStockCount > 0 && (
                          <Badge variant="outline" className="text-xs font-normal border-destructive text-destructive">
                            {visit.outOfStockCount} F.E.
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, icon, loading, valueClassName = "" }: { title: string, value?: number, icon: React.ReactNode, loading: boolean, valueClassName?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium tracking-tight text-muted-foreground">{title}</p>
          {icon}
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <div className={cn("text-2xl md:text-3xl font-bold font-mono tracking-tighter", valueClassName)}>
              {value !== undefined ? value : "-"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}