import { useGetDashboardSummary, useGetRecentVisits } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Store, Package, MapPin, AlertTriangle, AlertCircle, Clock, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    return format(parseISO(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "";
  }
};

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: recentVisits, isLoading: loadingVisits } = useGetRecentVisits();

  // 🔥 Pega as 3 últimas visitas
  const latestVisits = recentVisits?.slice(0, 3) || [];

  // 🔥 Conta ocorrências (produtos com problemas) nas visitas recentes
  const totalOccurrences = latestVisits.reduce((acc, visit) => {
    const hasProblems = visit.items?.some((item: any) => 
      item.inStock === false || 
      (item.supplyStatus && item.supplyStatus.length > 0)
    ) || false;
    return acc + (hasProblems ? 1 : 0);
  }, 0);

  // 🔥 Conta produtos fora de estoque nas visitas recentes
  const outOfStockCount = latestVisits.reduce((acc, visit) => {
    const count = visit.items?.filter((item: any) => item.inStock === false).length || 0;
    return acc + count;
  }, 0);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
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

      {/* Cards de Métricas */}
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
          value={summary?.outOfStockCount || 0} 
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />} 
          loading={loadingSummary}
          valueClassName="text-destructive"
          linkTo="/visits?filter=out-of-stock"
        />
        <SummaryCard 
          title="Visitas Esta Semana" 
          value={summary?.visitsThisWeek} 
          icon={<Clock className="h-5 w-5 text-muted-foreground" />} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Ocorrências" 
          value={summary?.occurrenceCount || 0} 
          icon={<AlertCircle className="h-5 w-5 text-yellow-500" />} 
          loading={loadingSummary}
          valueClassName="text-yellow-600"
          linkTo="/visits?filter=occurrences"
        />
      </div>

      {/* Visitas Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Visitas Recentes
          </CardTitle>
          <Link href="/visits" className="text-sm font-normal text-primary hover:underline flex items-center gap-1">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loadingVisits ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : latestVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma visita recente.</p>
          ) : (
            <div className="space-y-4">
              {latestVisits.map((visit) => {
                const hasOccurrences = visit.items?.some((item: any) => 
                  item.inStock === false || 
                  (item.supplyStatus && item.supplyStatus.length > 0)
                ) || false;

                const outOfStockItems = visit.items?.filter((item: any) => item.inStock === false).length || 0;

                return (
                  <div key={visit.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex gap-4 items-center flex-1">
                      <div className="bg-accent rounded-md p-3 flex flex-col items-center justify-center min-w-16">
                        <span className="text-xs font-bold uppercase text-muted-foreground">
                          {visit.visited_at ? format(parseISO(visit.visited_at), 'MMM', { locale: ptBR }) : ''}
                        </span>
                        <span className="text-lg font-bold leading-none">
                          {visit.visited_at ? format(parseISO(visit.visited_at), 'd') : ''}
                        </span>
                      </div>
                      <div className="flex-1">
                        <Link href={`/visits/${visit.id}`} className="font-semibold hover:underline">
                          {visit.store_name || 'Loja sem nome'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary" className="text-xs font-normal">
                            {visit.items?.length || 0} itens
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-normal">
                            {formatDateTime(visit.visited_at)}
                          </Badge>
                          {outOfStockItems > 0 && (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200 text-xs">
                              {outOfStockItems} F.E.
                            </Badge>
                          )}
                          {hasOccurrences && (
                            <Badge variant="destructive" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200 text-xs">
                              ⚠️ Ocorrência
                            </Badge>
                          )}
                          {visit.status === 'completed' ? (
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 text-xs">
                              ✅ Finalizada
                            </Badge>
                          ) : visit.status === 'draft' ? (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                              📝 Rascunho
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon, 
  loading, 
  valueClassName = "",
  linkTo
}: { 
  title: string, 
  value?: number, 
  icon: React.ReactNode, 
  loading: boolean, 
  valueClassName?: string,
  linkTo?: string
}) {
  const content = (
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

  if (linkTo) {
    return (
      <Link href={linkTo} className="cursor-pointer hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
