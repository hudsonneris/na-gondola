import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Layout } from '@/components/layout';
import Dashboard from '@/pages/dashboard';
import Stores from '@/pages/stores';
import StoreDetail from '@/pages/store-detail';
import Products from '@/pages/products';
import Visits from '@/pages/visits';
import VisitDetail from '@/pages/visit-detail';
import NewVisit from '@/pages/visit-new';
import Tasks from '@/pages/tasks';
import Clients from '@/pages/clients';
import Promoters from '@/pages/promoters';
import SupplyStatus from '@/pages/supply-status';
import Networks from '@/pages/networks';      // 🔥 NOVO
import Categories from '@/pages/categories';  // 🔥 NOVO
import Reports from '@/pages/reports';        // 🔥 NOVO
import Login from '@/pages/login';            // 🔥 NOVO
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          404 - Page Not Found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested page does not exist.
        </p>
      </div>
    </div>
  );
}

function AppRouter() {
  // 🔥 Simulação de autenticação
  const isLoggedIn = true;

  if (!isLoggedIn) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/stores" component={Stores} />
        <Route path="/stores/:id" component={StoreDetail} />
        <Route path="/products" component={Products} />
        <Route path="/visits" component={Visits} />
        <Route path="/visits/new" component={NewVisit} />
        <Route path="/visits/:id" component={VisitDetail} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/clients" component={Clients} />
        <Route path="/promoters" component={Promoters} />
        <Route path="/supply-status" component={SupplyStatus} />
        <Route path="/networks" component={Networks} />         // 🔥 NOVO
        <Route path="/categories" component={Categories} />     // 🔥 NOVO
        <Route path="/reports" component={Reports} />           // 🔥 NOVO
        <Route path="/login" component={Login} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppRouter />
      </WouterRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;