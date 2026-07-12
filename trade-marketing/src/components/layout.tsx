import { Link, useLocation } from "wouter";
import { LayoutDashboard, Store, Package, MapPin, Calendar, Building, Users, ClipboardList, Network, Tag, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Painel", href: "/", icon: LayoutDashboard },
  { name: "Visitas", href: "/visits", icon: MapPin },
  { name: "Lojas", href: "/stores", icon: Store },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Tarefas", href: "/tasks", icon: Calendar },
  { name: "Redes", href: "/networks", icon: Network },        // 🔥 NOVO
  { name: "Categorias", href: "/categories", icon: Tag },    // 🔥 NOVO
  { name: "Clientes", href: "/clients", icon: Building },
  { name: "Promotores", href: "/promoters", icon: Users },
  { name: "Abastecimento", href: "/supply-status", icon: ClipboardList },
  { name: "Relatórios", href: "/reports", icon: ClipboardList }, // 🔥 NOVO
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // 🔥 Simulação de usuário logado
  const isLoggedIn = true;
  const userRole = "admin"; // admin, manager, supervisor, promoter, client

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-card border-r border-border md:min-h-screen flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-primary">
            <MapPin className="h-6 w-6" />
            <span>TRADEVIEW</span>
          </div>
          {isLoggedIn && (
            <div className="mt-2 text-xs text-muted-foreground">
              {userRole === "admin" && "👑 Administrador"}
              {userRole === "manager" && "📊 Gestor"}
              {userRole === "supervisor" && "👔 Supervisor"}
              {userRole === "promoter" && "🛒 Promotor"}
              {userRole === "client" && "🏢 Cliente"}
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-1 pb-4 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          {navigation.map((item) => {
            // 🔥 Controle de permissões (exemplo)
            if (userRole === "promoter" && item.href === "/reports") return null;
            if (userRole === "promoter" && item.href === "/networks") return null;
            if (userRole === "promoter" && item.href === "/categories") return null;
            if (userRole === "promoter" && item.href === "/clients") return null;
            if (userRole === "promoter" && item.href === "/promoters") return null;
            if (userRole === "promoter" && item.href === "/supply-status") return null;

            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-colors shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        {isLoggedIn && (
          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        )}
      </div>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

// 🔥 Import do Button
import { Button } from "@/components/ui/button";