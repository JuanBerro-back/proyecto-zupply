import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ShoppingCart, Calculator, Package, Users,
  UtensilsCrossed, Truck, Warehouse, LogOut, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const RESTAURANTE_NAV = [
  { name: "Dashboard",     href: "/",           icon: LayoutDashboard },
  { name: "Pedidos",       href: "/pedidos",     icon: ShoppingCart    },
  { name: "Inventario",    href: "/inventario",  icon: Package         },
  { name: "Contabilidad",  href: "/contabilidad",icon: Calculator      },
  { name: "Proveedores",   href: "/proveedores", icon: Users           },
  { name: "Costeo Platos", href: "/costeo",      icon: UtensilsCrossed },
];

const PROVEEDOR_NAV = [
  { name: "Panel Principal",   href: "/",              icon: LayoutDashboard },
  { name: "Logística & Flota", href: "/logistica",     icon: Truck           },
  { name: "Mi Inventario",     href: "/mi-inventario", icon: Warehouse       },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navigation = user?.role === "proveedor" ? PROVEEDOR_NAV : RESTAURANTE_NAV;
  const isProveedor = user?.role === "proveedor";

  const activeItem = navigation.find(
    (item) => location === item.href || (item.href !== "/" && location.startsWith(item.href))
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black">
              Z
            </div>
            Zupply IA
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className={`mx-3 mt-3 rounded-lg p-3 ${isProveedor ? "bg-blue-50 border border-blue-200" : "bg-orange-50 border border-orange-200"}`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{user.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.entity}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isProveedor ? "bg-blue-500 text-white" : "bg-orange-500 text-white"
              }`}>
                {isProveedor ? "Proveedor" : "Restaurante"}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-8 flex-shrink-0 gap-3">
          <h1 className="text-xl font-semibold text-foreground flex-1">
            {activeItem?.name ?? "Zupply IA"}
          </h1>
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{user.avatar}</span>
              <span className="font-medium">{user.entity}</span>
            </div>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
