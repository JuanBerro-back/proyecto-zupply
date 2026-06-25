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
import Facturacion from "@/pages/restaurante/Facturacion";
import ProveedorDashboard from "@/pages/proveedor/ProveedorDashboard";
import ProveedorLogistica from "@/pages/proveedor/ProveedorLogistica";
import ProveedorInventario from "@/pages/proveedor/ProveedorInventario";
import DomiciliarioGPS from "@/pages/proveedor/DomiciliarioGPS";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// ── Blocked page for insufficient permissions ────────────────────────────
function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <span className="text-5xl">🔒</span>
      <h2 className="text-xl font-bold">Acceso restringido</h2>
      <p className="text-muted-foreground text-sm max-w-xs">
        No tienes permisos para ver este módulo. Contacta a tu administrador.
      </p>
    </div>
  );
}

// ── Route guard ──────────────────────────────────────────────────────────
function Guarded({ perm, children }: { perm: string; children: React.ReactNode }) {
  const { can } = useAuth();
  return can(perm) ? <>{children}</> : <AccessDenied />;
}

// ── Restaurant routes ────────────────────────────────────────────────────
function RestauranteRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/">
          {() => <Guarded perm="dashboard"><Dashboard /></Guarded>}
        </Route>
        <Route path="/pedidos">
          {() => <Guarded perm="pedidos"><Pedidos /></Guarded>}
        </Route>
        <Route path="/inventario">
          {() => <Guarded perm="inventario"><Inventario /></Guarded>}
        </Route>
        <Route path="/contabilidad">
          {() => <Guarded perm="contabilidad"><Contabilidad /></Guarded>}
        </Route>
        <Route path="/proveedores">
          {() => <Guarded perm="proveedores"><Proveedores /></Guarded>}
        </Route>
        <Route path="/costeo">
          {() => <Guarded perm="costeo"><CosteoPlatos /></Guarded>}
        </Route>
        <Route path="/facturacion">
          {() => <Guarded perm="facturacion"><Facturacion /></Guarded>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

// ── Supplier routes ──────────────────────────────────────────────────────
function ProveedorRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/">
          {() => <Guarded perm="prov:dashboard"><ProveedorDashboard /></Guarded>}
        </Route>
        <Route path="/logistica">
          {() => <Guarded perm="prov:logistica"><ProveedorLogistica /></Guarded>}
        </Route>
        <Route path="/mi-inventario">
          {() => <Guarded perm="prov:inventario"><ProveedorInventario /></Guarded>}
        </Route>
        <Route path="/gps">
          {() => <Guarded perm="prov:gps"><DomiciliarioGPS /></Guarded>}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

// ── Root auth gate ───────────────────────────────────────────────────────
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
