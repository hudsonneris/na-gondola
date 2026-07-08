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
