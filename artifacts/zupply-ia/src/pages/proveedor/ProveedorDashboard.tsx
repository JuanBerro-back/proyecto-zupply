import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag, DollarSign, TrendingUp, Clock,
  CheckCircle, Truck, ChevronRight, Package, Star,
} from "lucide-react";

type OrderStatus = "nuevo" | "preparando" | "despachado" | "entregado";

type IncomingOrder = {
  id: string;
  restaurante: string;
  items: { name: string; qty: number; unit: string }[];
  total: number;
  status: OrderStatus;
  hora: string;
  address: string;
};

const INITIAL_ORDERS: IncomingOrder[] = [
  {
    id: "ZIA-101",
    restaurante: "Rancho Grande BGA",
    items: [{ name: "Carne de res 90/10", qty: 15, unit: "kg" }, { name: "Costilla", qty: 8, unit: "kg" }],
    total: 465000,
    status: "nuevo",
    hora: "08:42",
    address: "Cra 27 #45-32, Cabecera",
  },
  {
    id: "ZIA-102",
    restaurante: "Fogón Santandereano",
    items: [{ name: "Carne molida", qty: 20, unit: "kg" }, { name: "Lomo de res", qty: 5, unit: "kg" }],
    total: 720000,
    status: "preparando",
    hora: "09:15",
    address: "Calle 35 #22-10, San Pío",
  },
  {
    id: "ZIA-103",
    restaurante: "La Castellana Grill",
    items: [{ name: "Pechuga pollo", qty: 12, unit: "kg" }],
    total: 132000,
    status: "despachado",
    hora: "07:55",
    address: "Av. Quebradaseca 31-40",
  },
  {
    id: "ZIA-104",
    restaurante: "Fritanguería Bonita",
    items: [{ name: "Chicharrón", qty: 10, unit: "kg" }, { name: "Costilla", qty: 6, unit: "kg" }],
    total: 280000,
    status: "nuevo",
    hora: "10:02",
    address: "Cra 15 #56-22, Floridablanca",
  },
  {
    id: "ZIA-105",
    restaurante: "El Corral BGA",
    items: [{ name: "Carne de res 90/10", qty: 30, unit: "kg" }],
    total: 870000,
    status: "entregado",
    hora: "07:20",
    address: "CC Cabecera Local 204",
  },
  {
    id: "ZIA-106",
    restaurante: "Rancho Grande BGA",
    items: [{ name: "Lomo de res", qty: 8, unit: "kg" }],
    total: 296000,
    status: "preparando",
    hora: "09:50",
    address: "Cra 27 #45-32, Cabecera",
  },
];

const COLUMNS: { key: OrderStatus; label: string; color: string; icon: React.ElementType }[] = [
  { key: "nuevo",      label: "Nuevos",      color: "bg-blue-100 border-blue-300",   icon: Clock       },
  { key: "preparando", label: "Preparando",  color: "bg-yellow-100 border-yellow-300", icon: Package   },
  { key: "despachado", label: "Despachado",  color: "bg-orange-100 border-orange-300", icon: Truck     },
  { key: "entregado",  label: "Entregado",   color: "bg-green-100 border-green-300",  icon: CheckCircle },
];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  nuevo: "preparando",
  preparando: "despachado",
  despachado: "entregado",
  entregado: null,
};
const NEXT_LABEL: Record<OrderStatus, string> = {
  nuevo: "Aceptar y Preparar",
  preparando: "Marcar Listo p/ Despacho",
  despachado: "Confirmar Entrega",
  entregado: "",
};

const BADGE_STYLES: Record<OrderStatus, string> = {
  nuevo:      "bg-blue-500 text-white",
  preparando: "bg-yellow-500 text-white",
  despachado: "bg-orange-500 text-white",
  entregado:  "bg-green-500 text-white",
};

export default function ProveedorDashboard() {
  const [orders, setOrders] = useState<IncomingOrder[]>(INITIAL_ORDERS);

  const advance = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const next = NEXT_STATUS[o.status];
        return next ? { ...o, status: next } : o;
      })
    );
  };

  const byStatus = (s: OrderStatus) => orders.filter((o) => o.status === s);
  const totalRevenue = orders.filter((o) => o.status === "entregado").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.status !== "entregado").length;
  const avgOrder = orders.length ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold">Panel del Proveedor</h2>
        <p className="text-muted-foreground text-sm">Gestiona los pedidos entrantes de tus restaurantes clientes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pedidos hoy", value: orders.length, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ingresos entregados", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pendientes", value: pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Ticket promedio", value: `$${avgOrder.toLocaleString()}`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-black">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban */}
      <div>
        <h3 className="font-semibold mb-3">Gestión de Pedidos — Kanban</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(({ key, label, color, icon: ColIcon }) => {
            const colOrders = byStatus(key);
            return (
              <div key={key} className={`rounded-xl border-2 ${color} p-3 space-y-3 min-h-[200px]`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ColIcon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{label}</span>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg p-3 shadow-sm border border-white/60 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="text-xs font-mono font-bold text-primary">{order.id}</p>
                        <p className="text-sm font-semibold leading-tight">{order.restaurante}</p>
                        <p className="text-xs text-muted-foreground">{order.hora} · {order.address}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${BADGE_STYLES[order.status]}`}>
                        {label}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-muted-foreground">
                          • {item.name} — {item.qty} {item.unit}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40">
                      <span className="text-sm font-bold text-green-700">${order.total.toLocaleString()}</span>
                      {NEXT_STATUS[order.status] && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2 gap-1"
                          onClick={() => advance(order.id)}
                        >
                          {NEXT_LABEL[order.status]} <ChevronRight className="w-3 h-3" />
                        </Button>
                      )}
                      {order.status === "entregado" && (
                        <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                          <CheckCircle className="w-3.5 h-3.5" /> Listo
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {colOrders.length === 0 && (
                  <p className="text-xs text-center text-muted-foreground py-4 opacity-60">Sin pedidos</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top clients */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Clientes Principales (hoy)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: "El Corral BGA", orders: 1, total: 870000 },
              { name: "Fogón Santandereano", orders: 1, total: 720000 },
              { name: "Rancho Grande BGA", orders: 2, total: 761000 },
              { name: "Fritanguería Bonita", orders: 1, total: 280000 },
            ].sort((a, b) => b.total - a.total).map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-xs font-bold flex items-center justify-center text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="text-sm font-bold">${c.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(c.total / 870000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
