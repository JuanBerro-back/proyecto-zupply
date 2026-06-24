import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Pedidos from "@/pages/Pedidos";
import Contabilidad from "@/pages/Contabilidad";
import Inventario from "@/pages/Inventario";
import Proveedores from "@/pages/Proveedores";
import CosteoPlatos from "@/pages/CosteoPlatos";
import ProveedorDashboard from "@/pages/proveedor/ProveedorDashboard";
import ProveedorLogistica from "@/pages/proveedor/ProveedorLogistica";
import ProveedorInventario from "@/pages/proveedor/ProveedorInventario";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function RestauranteRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pedidos" component={Pedidos} />
        <Route path="/contabilidad" component={Contabilidad} />
        <Route path="/inventario" component={Inventario} />
        <Route path="/proveedores" component={Proveedores} />
        <Route path="/costeo" component={CosteoPlatos} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function ProveedorRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={ProveedorDashboard} />
        <Route path="/logistica" component={ProveedorLogistica} />
        <Route path="/mi-inventario" component={ProveedorInventario} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function AuthGate() {
  const { user } = useAuth();
  if (!user) return <Login />;
  if (user.role === "proveedor") return <ProveedorRouter />;
  return <RestauranteRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthGate />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
