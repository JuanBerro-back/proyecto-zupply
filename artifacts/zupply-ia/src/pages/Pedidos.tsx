import { useState, useEffect, useRef } from "react";
import {
  useListProducts,
  useCreateOrder,
  useListOrders,
  useUpdateOrderStatus,
  getListOrdersQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart, Plus, Minus, Check, Package, Truck, Clock,
  Scan, ChevronDown, ChevronUp, AlertCircle, Star, MapPin, User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// ── Leaflet marker icons (avoid Vite asset issue) ──────────────────────────
function makeIcon(color: string, emoji: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;background:${color};border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:16px">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}
const originIcon = makeIcon("#16a34a", "🏪");
const destIcon   = makeIcon("#ea580c", "📍");
const driverIcon = makeIcon("#2563eb", "🏍️");

// ── Bucaramanga delivery scenarios ─────────────────────────────────────────
const SCENARIOS = [
  {
    origin: [7.1108, -73.1052] as [number, number],
    originLabel: "Despensa Gourmet — Cabecera del Llano",
    dest: [7.1347, -73.1228] as [number, number],
    destLabel: "Tu Restaurante — Centro",
    waypoints: [
      [7.1108, -73.1052],
      [7.1175, -73.1098],
      [7.1253, -73.1168],
      [7.1347, -73.1228],
    ] as [number, number][],
  },
  {
    origin: [7.0986, -73.0884] as [number, number],
    originLabel: "Carnes El Paisa — Floridablanca",
    dest: [7.1305, -73.1254] as [number, number],
    destLabel: "Tu Restaurante — San Pío",
    waypoints: [
      [7.0986, -73.0884],
      [7.1082, -73.1011],
      [7.1194, -73.1148],
      [7.1305, -73.1254],
    ] as [number, number][],
  },
  {
    origin: [7.1412, -73.1080] as [number, number],
    originLabel: "FrescoVerde — Girón",
    dest: [7.1220, -73.1196] as [number, number],
    destLabel: "Tu Restaurante — Sotomayor",
    waypoints: [
      [7.1412, -73.1080],
      [7.1350, -73.1098],
      [7.1280, -73.1145],
      [7.1220, -73.1196],
    ] as [number, number][],
  },
];

const DRIVERS = [
  { name: "Carlos Mendoza", rating: 4.8, vehicle: "Moto Honda CG150", plate: "BUC-412", avatar: "👨🏽‍🦱", trips: 1240 },
  { name: "Andrés Torres", rating: 4.5, vehicle: "Furgón Renault Master", plate: "BUC-789", avatar: "👨🏻‍🦳", trips: 876 },
  { name: "Luis Herrera", rating: 4.9, vehicle: "Moto Yamaha MT-07", plate: "BUC-231", avatar: "👨🏿", trips: 2105 },
];

// ── Tracking stages ────────────────────────────────────────────────────────
const STAGES = [
  { key: "pending",   label: "Pendiente",  icon: Clock,   color: "text-yellow-500" },
  { key: "confirmed", label: "Confirmado", icon: Check,   color: "text-blue-500"   },
  { key: "in_transit",label: "En Camino",  icon: Truck,   color: "text-orange-500" },
  { key: "delivered", label: "Entregado",  icon: Package, color: "text-green-500"  },
];

function getStageIdx(status: string) {
  if (status === "delivered") return 3;
  if (status === "confirmed") return 1;
  return 0;
}

function simulateStatus(order: { status: string; createdAt: string }) {
  if (order.status === "delivered" || order.status === "cancelled") return order.status;
  const mins = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  if (mins > 15) return "in_transit";
  if (mins > 5)  return "confirmed";
  return "pending";
}

// ── FitBounds helper ───────────────────────────────────────────────────────
function FitBounds({ waypoints }: { waypoints: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints.length < 2) return;
    map.fitBounds(L.latLngBounds(waypoints), { padding: [30, 30] });
  }, [map, waypoints]);
  return null;
}

// ── Live driver position animation ────────────────────────────────────────
function useLiveDriver(waypoints: [number, number][], stageIdx: number) {
  const [pos, setPos] = useState<[number, number]>(waypoints[1] ?? waypoints[0]);
  const progressRef = useRef(0);

  useEffect(() => {
    if (stageIdx < 2) {
      // Not in transit yet — show at first waypoint
      setPos(waypoints[1] ?? waypoints[0]);
      return;
    }
    if (stageIdx >= 3) {
      setPos(waypoints[waypoints.length - 1]);
      return;
    }
    const interval = setInterval(() => {
      progressRef.current = Math.min(progressRef.current + 0.003, 0.95);
      const t = progressRef.current;
      const segment = Math.floor(t * (waypoints.length - 1));
      const segT = (t * (waypoints.length - 1)) - segment;
      const from = waypoints[Math.min(segment, waypoints.length - 2)];
      const to   = waypoints[Math.min(segment + 1, waypoints.length - 1)];
      setPos([
        from[0] + (to[0] - from[0]) * segT,
        from[1] + (to[1] - from[1]) * segT,
      ]);
    }, 600);
    return () => clearInterval(interval);
  }, [stageIdx, waypoints]);

  return pos;
}

// ── Delivery Map component ─────────────────────────────────────────────────
function DeliveryMap({
  order,
  stageIdx,
}: {
  order: { id: number; status: string; createdAt: string };
  stageIdx: number;
}) {
  const scenario = SCENARIOS[order.id % SCENARIOS.length];
  const driver   = DRIVERS[order.id % DRIVERS.length];
  const driverPos = useLiveDriver(scenario.waypoints, stageIdx);

  return (
    <div className="space-y-3">
      {/* Driver card */}
      <div className="rounded-lg border bg-blue-50 border-blue-200 p-3 flex items-center gap-3">
        <div className="text-3xl">{driver.avatar}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{driver.name}</p>
            <div className="flex items-center gap-0.5 text-yellow-500">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(driver.rating) ? "fill-current" : "opacity-30"}`} />
              ))}
              <span className="text-xs font-bold text-foreground ml-1">{driver.rating}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{driver.vehicle} · <span className="font-mono font-semibold">{driver.plate}</span></p>
          <p className="text-xs text-muted-foreground">{driver.trips.toLocaleString()} viajes completados</p>
        </div>
        <div className="text-right shrink-0">
          <Badge className="bg-blue-500 text-white text-xs">En Ruta</Badge>
          <p className="text-xs text-muted-foreground mt-1">ETA ~15 min</p>
        </div>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border" style={{ height: 260 }}>
        <MapContainer
          key={order.id}
          center={scenario.waypoints[1] ?? scenario.origin}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
        >
          <FitBounds waypoints={scenario.waypoints} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {/* Route line */}
          <Polyline
            positions={scenario.waypoints}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7, dashArray: "8 4" }}
          />
          {/* Origin */}
          <Marker position={scenario.origin} icon={originIcon}>
            <Popup>{scenario.originLabel}</Popup>
          </Marker>
          {/* Destination */}
          <Marker position={scenario.dest} icon={destIcon}>
            <Popup>{scenario.destLabel}</Popup>
          </Marker>
          {/* Live driver */}
          {stageIdx >= 2 && stageIdx < 3 && (
            <Marker position={driverPos} icon={driverIcon}>
              <Popup>{driver.name} — {driver.vehicle}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <div className="flex items-center gap-1"><span className="text-green-600">🏪</span> {scenario.originLabel}</div>
        <div className="flex items-center gap-1"><span className="text-orange-600">📍</span> {scenario.destLabel}</div>
      </div>
    </div>
  );
}

// ── Order card ─────────────────────────────────────────────────────────────
function OrderCard({ order }: {
  order: {
    id: number; status: string; totalAmount: number; supplierCount: number; createdAt: string;
    items?: { productName: string; quantity: number; unit: string; subtotal: number }[];
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const updateStatus = useUpdateOrderStatus();
  const queryClient  = useQueryClient();
  const { toast }    = useToast();

  const simStatus = simulateStatus(order);
  const stageIdx  = getStageIndex(simStatus);
  const expectedBarcode = `ZIA-${order.id}`;
  const isDeliverable = simStatus !== "delivered" && simStatus !== "cancelled";

  function getStageIndex(s: string) {
    if (s === "delivered") return 3;
    if (s === "in_transit") return 2;
    if (s === "confirmed") return 1;
    return 0;
  }

  const handleScan = () => {
    if (barcodeInput.trim() !== expectedBarcode) {
      setBarcodeError(`Código incorrecto. Esperado: ${expectedBarcode}`);
      return;
    }
    setBarcodeError("");
    updateStatus.mutate(
      { id: order.id, data: { status: "delivered" } },
      {
        onSuccess: () => {
          toast({ title: `Pedido #${order.id} entregado`, description: "Stock actualizado automáticamente." });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        },
      }
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Pedido #{order.id}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                {" · "}{order.supplierCount} proveedor(es)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={simStatus === "delivered" ? "default" : simStatus === "in_transit" ? "secondary" : "outline"}>
              {STAGES[getStageIndex(simStatus)]?.label ?? simStatus}
            </Badge>
            <span className="font-bold text-primary">${order.totalAmount.toLocaleString()}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-5">
          {/* Tracking progress */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estado del pedido</p>
            <div className="flex items-center">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = i === stageIdx;
                const isDone   = i < stageIdx;
                return (
                  <div key={stage.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive ? "border-primary bg-primary text-white shadow-md" :
                        isDone   ? "border-green-500 bg-green-500 text-white" :
                                   "border-border bg-muted text-muted-foreground"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${
                        isActive ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground"}`}>
                        {stage.label}
                      </span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stageIdx ? "bg-green-500" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map — shown when confirmed or in transit */}
          {stageIdx >= 1 && stageIdx < 3 && (
            <DeliveryMap order={order} stageIdx={stageIdx} />
          )}

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Productos</p>
              <div className="rounded-lg border divide-y">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2 text-sm">
                    <span>{item.productName} <span className="text-muted-foreground">× {item.quantity} {item.unit}</span></span>
                    <span className="font-medium">${item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barcode scanner */}
          {isDeliverable && (
            <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-semibold text-orange-800">Confirmar recepción con código de barras</p>
              </div>
              <p className="text-xs text-orange-600">
                Código del pedido:{" "}
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border">{expectedBarcode}</span>
              </p>
              <div className="flex gap-2">
                <Input
                  value={barcodeInput}
                  onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                  placeholder="Escanear o escribir código..."
                  className="font-mono text-sm bg-white"
                />
                <Button
                  size="sm"
                  onClick={handleScan}
                  disabled={updateStatus.isPending || !barcodeInput}
                  className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                >
                  <Check className="w-4 h-4 mr-1" /> Recibir
                </Button>
              </div>
              {barcodeError && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" /> {barcodeError}
                </div>
              )}
            </div>
          )}

          {simStatus === "delivered" && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
              <Check className="w-4 h-4" />
              Pedido recibido y productos ingresados al inventario automáticamente.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Main Pedidos page ──────────────────────────────────────────────────────
export default function Pedidos() {
  const { data: products, isLoading: loadingProducts } = useListProducts();
  const { data: orders, isLoading: loadingOrders }     = useListOrders();
  const [cart, setCart]           = useState<Record<number, number>>({});
  const [tab, setTab]             = useState<"catalogo" | "pedidos">("catalogo");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const createOrder  = useCreateOrder();
  const queryClient  = useQueryClient();
  const { toast }    = useToast();

  const addToCart    = (id: number) => setCart(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const removeFromCart = (id: number) => setCart(p => {
    const n = { ...p };
    if (n[id] > 1) n[id]--; else delete n[id];
    return n;
  });

  const handleCheckout = () => {
    if (!Object.keys(cart).length) return;
    createOrder.mutate(
      { data: { items: Object.entries(cart).map(([id, qty]) => ({ productId: parseInt(id), quantity: qty })) } },
      {
        onSuccess: () => {
          setCart({});
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          toast({ title: "Pedido enviado", description: "Tu pedido fue confirmado exitosamente." });
          setTab("pedidos");
        },
      }
    );
  };

  const categories   = ["Todos", ...Array.from(new Set(products?.map(p => p.category) ?? []))];
  const filtered     = categoryFilter === "Todos" ? products : products?.filter(p => p.category === categoryFilter);
  const cartTotal    = products?.reduce((t, p) => t + (cart[p.id] ? cart[p.id] * p.pricePerUnit : 0), 0) ?? 0;
  const cartCount    = Object.values(cart).reduce((a, b) => a + b, 0);
  const pendingCount = orders?.filter(o => o.status !== "delivered" && o.status !== "cancelled").length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {(["catalogo", "pedidos"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
              tab === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "catalogo" ? "Catálogo" : "Mis Pedidos"}
            {t === "pedidos" && pendingCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Catálogo ── */}
      {tab === "catalogo" && (
        <div className="flex gap-6 h-[calc(100vh-13rem)]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}
                >{cat}</button>
              ))}
            </div>

            {loadingProducts ? (
              <p className="text-muted-foreground">Cargando catálogo...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered?.map(product => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="text-xs font-semibold text-primary mb-1">{product.supplierName}</div>
                      <Badge variant="outline" className="w-fit text-xs mb-2">{product.category}</Badge>
                      <h3 className="font-medium flex-1">{product.name}</h3>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-bold text-sm">
                          ${product.pricePerUnit.toLocaleString()}
                          <span className="font-normal text-muted-foreground text-xs"> / {product.unit}</span>
                        </span>
                        {cart[product.id] ? (
                          <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(product.id)}><Minus className="w-3 h-3"/></Button>
                            <span className="text-sm font-bold w-5 text-center text-primary">{cart[product.id]}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(product.id)}><Plus className="w-3 h-3"/></Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(product.id)}><Plus className="w-4 h-4 mr-1"/>Agregar</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="w-80 border rounded-lg bg-card flex flex-col">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5"/>Carrito
                {cartCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">{cartCount}</span>
                )}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!Object.keys(cart).length ? (
                <p className="text-muted-foreground text-sm text-center py-8">El carrito está vacío</p>
              ) : (
                products?.filter(p => cart[p.id]).map(product => (
                  <div key={product.id} className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">${(product.pricePerUnit * cart[product.id]).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(product.id)}><Minus className="w-3 h-3"/></Button>
                      <span className="text-sm font-medium w-4 text-center">{cart[product.id]}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(product.id)}><Plus className="w-3 h-3"/></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t bg-muted/10">
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg text-primary">${cartTotal.toLocaleString()}</span>
              </div>
              <Button
                className="w-full" size="lg"
                disabled={!Object.keys(cart).length || createOrder.isPending}
                onClick={handleCheckout}
              >
                <Check className="w-5 h-5 mr-2"/>
                {createOrder.isPending ? "Confirmando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mis Pedidos ── */}
      {tab === "pedidos" && (
        <div className="space-y-4">
          {loadingOrders ? (
            <p className="text-muted-foreground">Cargando pedidos...</p>
          ) : !orders?.length ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30"/>
              <p>No tienes pedidos aún. Ve al catálogo y crea uno.</p>
            </div>
          ) : (
            [...orders].reverse().map(order => <OrderCard key={order.id} order={order}/>)
          )}
        </div>
      )}
    </div>
  );
}
