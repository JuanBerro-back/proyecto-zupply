import { useState } from "react";
import { useListInventory, useGetInventoryPredictions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function Inventario() {
  const { data: inventory, isLoading } = useListInventory();
  const [showPredictions, setShowPredictions] = useState(false);
  const { data: predictions, isLoading: loadingPredictions, refetch } = useGetInventoryPredictions({
    query: { enabled: false }
  });

  const handleRunAI = () => {
    setShowPredictions(true);
    refetch();
  };

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <Button onClick={handleRunAI} disabled={loadingPredictions} className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white border-0">
          <Brain className="w-5 h-5 mr-2" />
          Ejecutar Predicción IA
        </Button>
      </div>

      {showPredictions && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Recomendaciones de IA
          </h3>
          {loadingPredictions ? (
            <div>Calculando proyecciones...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions?.map((pred, i) => (
                <Card key={i} className={`border-l-4 ${pred.urgency === 'high' ? 'border-l-destructive' : pred.urgency === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">{pred.itemName}</h4>
                      <Badge variant={pred.urgency === 'high' ? 'destructive' : 'outline'}>{pred.urgency.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{pred.recommendation}</p>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Pedir: <span className="text-primary">{pred.recommendedOrderQty} {pred.unit}</span></span>
                      {pred.trend === 'increasing' ? <TrendingUp className="w-4 h-4 text-destructive"/> : 
                       pred.trend === 'decreasing' ? <TrendingDown className="w-4 h-4 text-green-500"/> : 
                       <Minus className="w-4 h-4 text-muted-foreground"/>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Mín / Máx</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="font-bold text-lg">{item.currentStock} <span className="text-sm text-muted-foreground font-normal">{item.unit}</span></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{item.minStock} / {item.maxStock}</TableCell>
                  <TableCell>
                    <Badge variant={item.stockStatus === 'critical' ? 'destructive' : item.stockStatus === 'low' ? 'secondary' : 'default'}
                           className={item.stockStatus === 'low' ? 'bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30' : ''}>
                      {item.stockStatus.toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
