import { useState } from "react";
import { useListProducts, useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Pedidos() {
  const { data: products, isLoading } = useListProducts();
  const [cart, setCart] = useState<Record<number, number>>({});
  const createOrder = useCreateOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addToCart = (productId: number) => {
    setCart(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[productId] > 1) {
        next[productId]--;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) return;
    
    createOrder.mutate({
      data: {
        items: Object.entries(cart).map(([id, qty]) => ({
          productId: parseInt(id),
          quantity: qty
        }))
      }
    }, {
      onSuccess: () => {
        setCart({});
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Pedido enviado exitosamente" });
      }
    });
  };

  const cartTotal = products?.reduce((total, p) => {
    return total + (cart[p.id] ? cart[p.id] * p.pricePerUnit : 0);
  }, 0) || 0;

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto pr-2">
        <h2 className="text-lg font-semibold mb-4">Catálogo de Productos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products?.map(product => (
            <Card key={product.id}>
              <CardContent className="p-4 flex flex-col h-full">
                <div className="text-xs font-semibold text-primary mb-1">{product.supplierName}</div>
                <h3 className="font-medium flex-1">{product.name}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-bold">${product.pricePerUnit.toLocaleString()} / {product.unit}</span>
                  <Button size="sm" onClick={() => addToCart(product.id)}><Plus className="w-4 h-4 mr-1"/> Agregar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="w-80 border rounded-lg bg-card flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-semibold flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Carrito</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(cart).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">El carrito está vacío</p>
          ) : (
            products?.filter(p => cart[p.id]).map(product => (
              <div key={product.id} className="flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">${(product.pricePerUnit * cart[product.id]).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-md p-1">
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
          <Button className="w-full" size="lg" disabled={Object.keys(cart).length === 0 || createOrder.isPending} onClick={handleCheckout}>
            <Check className="w-5 h-5 mr-2" />
            {createOrder.isPending ? "Confirmando..." : "Confirmar Pedido"}
          </Button>
        </div>
      </div>
    </div>
  );
}
