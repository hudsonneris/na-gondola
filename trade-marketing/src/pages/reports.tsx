import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar as CalendarIcon, Download, Image as ImageIcon, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";

interface ReportFilter {
  networkId: string;
  clientId: string;
  promoterId: string;
  startDate: string;
  endDate: string;
  city: string;
  state: string;
  supplyStatus: string;
  photoType: 'all' | 'before' | 'after';
}

interface VisitReport {
  id: number;
  storeName: string;
  storeCity: string;
  storeState: string;
  networkName: string | null;
  promoterName: string | null;
  visitedAt: string;
  photoBefore: string | null;
  photoAfter: string | null;
  items: {
    productName: string;
    inStock: boolean;
    supplyStatus: string[];
  }[];
}

export default function Reports() {
  const [reportType, setReportType] = useState<'photos' | 'data'>('photos');
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<VisitReport[]>([]);
  const [networks, setNetworks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [promoters, setPromoters] = useState<any[]>([]);
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReportFilter>({
    networkId: "",
    clientId: "",
    promoterId: "",
    startDate: "",
    endDate: "",
    city: "",
    state: "",
    supplyStatus: "",
    photoType: 'all',
  });

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [networksRes, clientsRes, promotersRes] = await Promise.all([
          fetch('/api/networks'),
          fetch('/api/clients'),
          fetch('/api/promoters'),
        ]);

        if (networksRes.ok) setNetworks(await networksRes.json());
        if (clientsRes.ok) setClients(await clientsRes.json());
        if (promotersRes.ok) setPromoters(await promotersRes.json());
      } catch (error) {
        console.error('Erro ao carregar filtros:', error);
      }
    };
    fetchFilters();
  }, []);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/reports?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data);
        toast({ description: `Relatório gerado com ${data.length} registros!` });
      } else {
        toast({ variant: "destructive", description: "Erro ao gerar relatório" });
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Erro ao gerar relatório" });
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    // Implementar exportação CSV
    toast({ description: "Função de exportação em desenvolvimento" });
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Gere relatórios detalhados das visitas.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={reportType === 'photos' ? 'default' : 'outline'}
            onClick={() => setReportType('photos')}
          >
            <ImageIcon className="h-4 w-4 mr-1" /> Fotos
          </Button>
          <Button 
            variant={reportType === 'data' ? 'default' : 'outline'}
            onClick={() => setReportType('data')}
          >
            <CalendarIcon className="h-4 w-4 mr-1" /> Dados
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rede</label>
              <Select 
                value={filters.networkId} 
                onValueChange={(val) => setFilters({ ...filters, networkId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {networks.map((n) => (
                    <SelectItem key={n.id} value={n.id.toString()}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select 
                value={filters.clientId} 
                onValueChange={(val) => setFilters({ ...filters, clientId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Promotor</label>
              <Select 
                value={filters.promoterId} 
                onValueChange={(val) => setFilters({ ...filters, promoterId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {promoters.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={filters.supplyStatus} 
                onValueChange={(val) => setFilters({ ...filters, supplyStatus: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Organizado">Organizado</SelectItem>
                  <SelectItem value="Abastecido">Abastecido</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Fora de estoque">Fora de estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input 
                type="date" 
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input 
                type="date" 
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Input 
                placeholder="Filtrar por cidade"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Input 
                placeholder="UF"
                value={filters.state}
                onChange={(e) => setFilters({ ...filters, state: e.target.value.toUpperCase() })}
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            {reports.length > 0 && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Exportar CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhum registro encontrado. Aplique os filtros e clique em "Gerar Relatório".
          </CardContent>
        </Card>
      ) : reportType === 'photos' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{report.storeName}</h4>
                    <p className="text-xs text-muted-foreground">
                      {report.networkName} • {format(parseISO(report.visitedAt), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <Badge variant="secondary">{report.items.length} produtos</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="aspect-square bg-muted rounded overflow-hidden">
                    {report.photoBefore ? (
                      <img 
                        src={report.photoBefore} 
                        alt="Antes" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Sem foto
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground py-1">ANTES</p>
                  </div>
                  <div className="aspect-square bg-muted rounded overflow-hidden">
                    {report.photoAfter ? (
                      <img 
                        src={report.photoAfter} 
                        alt="Depois" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Sem foto
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground py-1">DEPOIS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-md bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loja</TableHead>
                <TableHead>Rede</TableHead>
                <TableHead>Promotor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.storeName}</TableCell>
                  <TableCell>{report.networkName || '-'}</TableCell>
                  <TableCell>{report.promoterName || '-'}</TableCell>
                  <TableCell>{format(parseISO(report.visitedAt), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{report.items.length}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {report.items.flatMap(i => i.supplyStatus || []).slice(0, 3).map((status, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {status}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}