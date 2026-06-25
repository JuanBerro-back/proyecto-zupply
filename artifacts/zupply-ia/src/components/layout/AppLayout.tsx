import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, ShoppingCart, Calculator, Package, Users,
  UtensilsCrossed, Truck, Warehouse, LogOut, Receipt, Lock,
} from "lucide-react";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "@/context/AuthContext";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  perm: string;
};

const RESTAURANTE_NAV: NavItem[] = [
  { name: "Dashboard",     href: "/",            icon: LayoutDashboard, perm: "dashboard"    },
  { name: "Pedidos",       href: "/pedidos",      icon: ShoppingCart,    perm: "pedidos"      },
  { name: "Inventario",    href: "/inventario",   icon: Package,         perm: "inventario"   },
  { name: "Contabilidad",  href: "/contabilidad", icon: Calculator,      perm: "contabilidad" },
  { name: "Facturación",   href: "/facturacion",  icon: Receipt,         perm: "facturacion"  },
  { name: "Proveedores",   href: "/proveedores",  icon: Users,           perm: "proveedores"  },
  { name: "Costeo Platos", href: "/costeo",        icon: UtensilsCrossed, perm: "costeo"       },
];

const PROVEEDOR_NAV: NavItem[] = [
  { name: "Panel Principal",   href: "/",              icon: LayoutDashboard, perm: "prov:dashboard"  },
  { name: "Logística & Flota", href: "/logistica",     icon: Truck,           perm: "prov:logistica"  },
  { name: "Mi Inventario",     href: "/mi-inventario", icon: Warehouse,       perm: "prov:inventario" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, can } = useAuth();

  const isProveedor = user?.role === "proveedor";
  const allNav = isProveedor ? PROVEEDOR_NAV : RESTAURANTE_NAV;

  const activeItem = allNav.find(
    (item) => location === item.href || (item.href !== "/" && location.startsWith(item.href))
  );

  const subRoleLabel = user ? ROLE_LABELS[user.subRole] : "";
  const subRoleColor = user ? ROLE_COLORS[user.subRole] : "bg-gray-500";

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-black">
              Z
            </div>
            Zupply IA
          </div>
        </div>

        {/* User card */}
        {user && (
          <div className={`mx-3 mt-3 rounded-xl p-3 shrink-0 ${
            isProveedor ? "bg-blue-50 border border-blue-200" : "bg-orange-50 border border-orange-200"
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-2xl mt-0.5">{user.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.entity}</p>
                <span className={`inline-block text-xs text-white px-2 py-0.5 rounded-full font-semibold mt-1 ${subRoleColor}`}>
                  {subRoleLabel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {allNav.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            const hasAccess = can(item.perm);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : hasAccess
                    ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    : "text-muted-foreground/50 cursor-not-allowed"
                }`}
                onClick={!hasAccess ? (e) => e.preventDefault() : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.name}</span>
                {!hasAccess && <Lock className="w-3.5 h-3.5 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-card flex items-center px-8 shrink-0 gap-3">
          <h1 className="text-xl font-semibold flex-1">{activeItem?.name ?? "Zupply IA"}</h1>
          {user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{user.avatar}</span>
              <span className="font-medium">{user.entity}</span>
              <span className={`text-xs text-white px-2 py-0.5 rounded-full font-semibold ${subRoleColor}`}>
                {subRoleLabel}
              </span>
            </div>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}
