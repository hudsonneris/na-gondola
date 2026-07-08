import { Link, useLocation } from "wouter";
import { LayoutDashboard, Store, Package, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Visits", href: "/visits", icon: MapPin },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Products", href: "/products", icon: Package },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-card border-r border-border md:min-h-screen flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight text-primary">
            <MapPin className="h-6 w-6" />
            <span>TRADEVIEW</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 pb-4 flex flex-row md:flex-col overflow-x-auto md:overflow-visible">
          {navigation.map((item) => {
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
      </div>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
