import { useState } from "react";
import { useListInventory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  ChefHat,
  TrendingUp,
  DollarSign,
  Percent,
  BookOpen,
} from "lucide-react";

type Ingredient = {
  inventoryId: number;
  name: string;
  unit: string;
  qty: number;
  costPerUnit: number;
};

type SavedDish = {
  id: string;
  name: string;
  ingredients: Ingredient[];
  totalCost: number;
  suggestedPrice: number;
  margin: number;
  createdAt: string;
};

const MARGIN_OPTIONS = [
  { label: "30% margen (precio × 1.43)", multiplier: 1 / 0.3, margin: 30 },
  { label: "35% margen (precio × 1.54)", multiplier: 1 / 0.35, margin: 35 },
  { label: "40% margen (precio × 1.67)", multiplier: 1 / 0.4, margin: 40 },
  { label: "50% margen (precio × 2.0)", multiplier: 2.0, margin: 50 },
  { label: "66% margen (precio × 3.0)", multiplier: 3.0, margin: 66 },
];

function formatCOP(amount: number) {
  return `$${Math.round(amount).toLocaleString("es-CO")}`;
}

export default function CosteoPlatos() {
  const { data: inventory, isLoading } = useListInventory();

  const [dishName, setDishName] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [selectedQty, setSelectedQty] = useState("");
  const [selectedMarginIdx, setSelectedMarginIdx] = useState(4);
  const [savedDishes, setSavedDishes] = useState<SavedDish[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("zupply_dishes") ?? "[]");
    } catch {
      return [];
    }
  });
  const [viewDish, setViewDish] = useState<SavedDish | null>(null);

  const totalCost = ingredients.reduce((sum, i) => sum + i.qty * i.costPerUnit, 0);
  const { multiplier, margin } = MARGIN_OPTIONS[selectedMarginIdx];
  const suggestedPrice = totalCost * multiplier;

  const addIngredient = () => {
    if (!selectedInventoryId || !selectedQty) return;
    const item = inventory?.find((i) => i.id === parseInt(selectedInventoryId));
    if (!item) return;
    const qty = parseFloat(selectedQty);
    if (isNaN(qty) || qty <= 0) return;

    setIngredients((prev) => {
      const existing = prev.findIndex((x) => x.inventoryId === item.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...next[existing], qty };
        return next;
      }
      return [
        ...prev,
        {
          inventoryId: item.id,
          name: item.name,
          unit: item.unit,
          qty,
          costPerUnit: item.costPerUnit,
        },
      ];
    });
    setSelectedInventoryId("");
    setSelectedQty("");
  };

  const removeIngredient = (id: number) =>
    setIngredients((prev) => prev.filter((i) => i.inventoryId !== id));

  const saveDish = () => {
    if (!dishName || ingredients.length === 0) return;
    const dish: SavedDish = {
      id: crypto.randomUUID(),
      name: dishName,
      ingredients,
      totalCost,
      suggestedPrice,
      margin,
      createdAt: new Date().toISOString(),
    };
    const updated = [dish, ...savedDishes];
    setSavedDishes(updated);
    localStorage.setItem("zupply_dishes", JSON.stringify(updated));
    setDishName("");
    setIngredients([]);
  };

  const deleteDish = (id: string) => {
    const updated = savedDishes.filter((d) => d.id !== id);
    setSavedDishes(updated);
    localStorage.setItem("zupply_dishes", JSON.stringify(updated));
    if (viewDish?.id === id) setViewDish(null);
  };

  if (isLoading) return <div className="text-muted-foreground">Cargando inventario...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <ChefHat className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Costeo Inteligente de Platos</h2>
          <p className="text-sm text-muted-foreground">Calcula el costo de producción y el precio de venta sugerido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Builder */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" /> Crear Plato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <Label>Nombre del Plato</Label>
                <Input
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="Ej: Bandeja Paisa, Ajiaco Bogotano..."
                />
              </div>

              {/* Add ingredient */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Agregar ingrediente del inventario</p>
                <div className="flex gap-2">
                  <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                    <SelectTrigger className="flex-1 bg-white">
                      <SelectValue placeholder="Selecciona ingrediente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inventory?.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.name} ({item.unit}) — {formatCOP(item.costPerUnit)}/{item.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">
                      Cantidad ({inventory?.find((i) => i.id === parseInt(selectedInventoryId))?.unit ?? "unidad"})
                    </Label>
                    <Input
                      type="number"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                      placeholder="0"
                      className="bg-white"
                    />
                  </div>
                  <Button
                    onClick={addIngredient}
                    disabled={!selectedInventoryId || !selectedQty}
                    size="sm"
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </Button>
                </div>
              </div>

              {/* Ingredients table */}
              {ingredients.length > 0 && (
                <div className="rounded-lg border divide-y overflow-hidden">
                  <div className="grid grid-cols-4 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="col-span-2">Ingrediente</span>
                    <span>Cantidad</span>
                    <span className="text-right">Costo</span>
                  </div>
                  {ingredients.map((ing) => {
                    const lineCost = ing.qty * ing.costPerUnit;
                    return (
                      <div key={ing.inventoryId} className="grid grid-cols-4 items-center px-3 py-2 text-sm hover:bg-muted/20 group">
                        <div className="col-span-2 flex items-center gap-2">
                          <button
                            onClick={() => removeIngredient(ing.inventoryId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-medium">{ing.name}</span>
                        </div>
                        <span className="text-muted-foreground">{ing.qty} {ing.unit}</span>
                        <span className="text-right font-medium">{formatCOP(lineCost)}</span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-4 px-3 py-2 bg-muted/30 text-sm font-bold">
                    <span className="col-span-3">Total Insumos</span>
                    <span className="text-right text-primary">{formatCOP(totalCost)}</span>
                  </div>
                </div>
              )}

              {/* Margin selector */}
              <div className="space-y-2">
                <Label>Margen de ganancia objetivo</Label>
                <div className="flex flex-wrap gap-2">
                  {MARGIN_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedMarginIdx(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedMarginIdx === idx
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-muted-foreground border-border hover:border-primary"
                      }`}
                    >
                      {opt.margin}%
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={!dishName || ingredients.length === 0}
                onClick={saveDish}
              >
                Guardar Plato
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Price card + saved dishes */}
        <div className="space-y-5">
          {/* Live price card */}
          {ingredients.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                  <ChefHat className="w-6 h-6" />
                  {dishName || "Tu Plato"}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white/80 border p-3 text-center">
                    <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Costo producción</p>
                    <p className="text-lg font-bold text-primary">{formatCOP(totalCost)}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 border p-3 text-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Precio sugerido</p>
                    <p className="text-lg font-bold text-green-700">{formatCOP(suggestedPrice)}</p>
                  </div>
                  <div className="rounded-lg bg-white/80 border p-3 text-center">
                    <Percent className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">Margen bruto</p>
                    <p className="text-lg font-bold text-blue-700">{margin}%</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground bg-white/60 rounded px-3 py-2">
                  💡 En Colombia, un margen del 66% (food cost del 34%) es estándar para restaurantes informales. Ajusta según tu segmento.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saved dishes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Mis Platos Guardados
                <Badge variant="outline" className="ml-auto">{savedDishes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {savedDishes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aún no tienes platos guardados. Crea tu primer plato.
                </p>
              ) : (
                savedDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm ${viewDish?.id === dish.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                    onClick={() => setViewDish(viewDish?.id === dish.id ? null : dish)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{dish.name}</p>
                        <p className="text-xs text-muted-foreground">{dish.ingredients.length} ingredientes · {formatCOP(dish.totalCost)} costo</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-700">{formatCOP(dish.suggestedPrice)}</p>
                          <p className="text-xs text-muted-foreground">{dish.margin}% margen</p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteDish(dish.id); }}
                          className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {viewDish?.id === dish.id && (
                      <div className="mt-3 pt-3 border-t space-y-1">
                        {dish.ingredients.map((ing) => (
                          <div key={ing.inventoryId} className="flex justify-between text-xs text-muted-foreground">
                            <span>{ing.name} × {ing.qty} {ing.unit}</span>
                            <span>{formatCOP(ing.qty * ing.costPerUnit)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
