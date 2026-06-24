import { useState } from "react";
import {
  useListProducts,
  useCreateOrder,
  useListOrders,
  useUpdateOrderStatus,
  getListOrdersQueryKey,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Plus,
  Minus,
  Check,
  Package,
  Truck,
  Clock,
  Scan,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TRACKING_STAGES = [
  { key: "pending", label: "Pendiente", icon: Clock, color: "text-yellow-500" },
  { key: "confirmed", label: "Confirmado", icon: Check, color: "text-blue-500" },
  { key: "in_transit", label: "En Camino", icon: Truck, color: "text-orange-500" },
  { key: "delivered", label: "Entregado", icon: Package, color: "text-green-500" },
];

function getStageIndex(status: string) {
  if (status === "delivered") return 3;
  if (status === "confirmed") return 1;
  if (status === "cancelled") return -1;
  return 0;
}

function getSimulatedStage(order: { status: string; createdAt: string }) {
  if (order.status === "delivered" || order.status === "cancelled") return order.status;
  const ageMinutes = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  if (ageMinutes > 10) return "confirmed";
  return "pending";
}

function OrderCard({
  order,
}: {
  order: {
    id: number;
    status: string;
    totalAmount: number;
    supplierCount: number;
    createdAt: string;
    items?: { productName: string; quantity: number; unit: string; subtotal: number }[];
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const simulatedStatus = getSimulatedStage(order);
  const stageIdx = getStageIndex(simulatedStatus);
  const expectedBarcode = `ZIA-${order.id}`;
  const isDeliverable = simulatedStatus !== "delivered" && simulatedStatus !== "cancelled";

  const handleBarcodeScan = () => {
    if (barcodeInput.trim() !== expectedBarcode) {
      setBarcodeError(`Código incorrecto. Esperado: ${expectedBarcode}`);
      return;
    }
    setBarcodeError("");
    updateStatus.mutate(
      { id: order.id, data: { status: "delivered" } },
      {
        onSuccess: () => {
          toast({ title: `Pedido #${order.id} marcado como entregado`, description: "Inventario actualizado automáticamente." });
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
            <span className="font-bold text-primary">${order.totalAmount.toLocaleString()}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-5">
          {/* Tracking Progress Bar */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estado del pedido</p>
            <div className="flex items-center gap-0">
              {TRACKING_STAGES.map((stage, i) => {
                const Icon = stage.icon;
                const isActive = i === stageIdx;
                const isDone = i < stageIdx;
                return (
                  <div key={stage.key} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          isActive
                            ? "border-primary bg-primary text-white shadow-md"
                            : isDone
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${isActive ? "text-primary" : isDone ? "text-green-600" : "text-muted-foreground"}`}>
                        {stage.label}
                      </span>
                    </div>
                    {i < TRACKING_STAGES.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < stageIdx ? "bg-green-500" : "bg-border"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
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

          {/* Barcode Scanner */}
          {isDeliverable && (
            <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-orange-600" />
                <p className="text-sm font-semibold text-orange-800">Confirmar recepción con código de barras</p>
              </div>
              <p className="text-xs text-orange-600">
                Código del pedido: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border">{expectedBarcode}</span>
              </p>
              <div className="flex gap-2">
                <Input
                  value={barcodeInput}
                  onChange={(e) => { setBarcodeInput(e.target.value); setBarcodeError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleBarcodeScan()}
                  placeholder={`Escanear o escribir código...`}
                  className="font-mono text-sm bg-white"
                />
                <Button
                  size="sm"
                  onClick={handleBarcodeScan}
                  disabled={updateStatus.isPending || !barcodeInput}
                  className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Recibir
                </Button>
              </div>
              {barcodeError && (
                <div className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="w-3 h-3" />
                  {barcodeError}
                </div>
              )}
            </div>
          )}

          {simulatedStatus === "delivered" && (
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

export default function Pedidos() {
  const { data: products, isLoading: loadingProducts } = useListProducts();
  const { data: orders, isLoading: loadingOrders } = useListOrders();
  const [cart, setCart] = useState<Record<number, number>>({});
  const [tab, setTab] = useState<"catalogo" | "pedidos">("catalogo");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCart = (productId: number) =>
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));

  const removeFromCart = (productId: number) =>
    setCart((prev) => {
      const next = { ...prev };
      if (next[productId] > 1) next[productId]--;
      else delete next[productId];
      return next;
    });

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) return;
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

  const categories = ["Todos", ...Array.from(new Set(products?.map((p) => p.category) ?? []))];
  const filteredProducts = categoryFilter === "Todos" ? products : products?.filter((p) => p.category === categoryFilter);
  const cartTotal = products?.reduce((t, p) => t + (cart[p.id] ? cart[p.id] * p.pricePerUnit : 0), 0) ?? 0;
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("catalogo")}
          className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "catalogo" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab("pedidos")}
          className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${tab === "pedidos" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Mis Pedidos
          {orders && orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
              {orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length}
            </span>
          )}
        </button>
      </div>

      {/* Catálogo Tab */}
      {tab === "catalogo" && (
        <div className="flex gap-6 h-[calc(100vh-13rem)]">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {/* Category filters */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    categoryFilter === cat
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {loadingProducts ? (
              <div className="text-muted-foreground">Cargando catálogo...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts?.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="text-xs font-semibold text-primary mb-1">{product.supplierName}</div>
                      <Badge variant="outline" className="w-fit text-xs mb-2">{product.category}</Badge>
                      <h3 className="font-medium flex-1">{product.name}</h3>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="font-bold text-sm">${product.pricePerUnit.toLocaleString()} <span className="font-normal text-muted-foreground text-xs">/ {product.unit}</span></span>
                        {cart[product.id] ? (
                          <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(product.id)}><Minus className="w-3 h-3" /></Button>
                            <span className="text-sm font-bold w-5 text-center text-primary">{cart[product.id]}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(product.id)}><Plus className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(product.id)}><Plus className="w-4 h-4 mr-1" /> Agregar</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart Panel */}
          <div className="w-80 border rounded-lg bg-card flex flex-col">
            <div className="p-4 border-b bg-muted/30">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
                {cartCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">{cartCount}</span>
                )}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {Object.keys(cart).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">El carrito está vacío</p>
              ) : (
                products?.filter((p) => cart[p.id]).map((product) => (
                  <div key={product.id} className="flex justify-between items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">${(product.pricePerUnit * cart[product.id]).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(product.id)}><Minus className="w-3 h-3" /></Button>
                      <span className="text-sm font-medium w-4 text-center">{cart[product.id]}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(product.id)}><Plus className="w-3 h-3" /></Button>
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
                className="w-full"
                size="lg"
                disabled={Object.keys(cart).length === 0 || createOrder.isPending}
                onClick={handleCheckout}
              >
                <Check className="w-5 h-5 mr-2" />
                {createOrder.isPending ? "Confirmando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mis Pedidos Tab */}
      {tab === "pedidos" && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="text-muted-foreground">Cargando pedidos...</div>
          ) : !orders || orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No tienes pedidos aún. Ve al catálogo y crea uno.</p>
            </div>
          ) : (
            [...orders].reverse().map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
