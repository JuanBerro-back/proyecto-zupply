import { useState, useEffect } from "react";
import { useListInventory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  UtensilsCrossed, Plus, Trash2, ChefHat, DollarSign,
  Percent, AlertTriangle, CheckCircle, Pencil, BookOpen,
  Save, X, TrendingUp,
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
  pvp: number;
  foodCostPct: number;
  createdAt: string;
};

function formatCOP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

// ── Food Cost % rules ─────────────────────────────────────────────────────
// Food Cost % = (Costo Total / PVP) * 100
// ≤ 30%  → verde  (ideal: margen ≥ 70%)
// 31-35% → amarillo (aceptable)
// > 35%  → rojo   (alerta: sube el PVP)

function fcColor(fc: number) {
  if (fc <= 30) return "text-green-700";
  if (fc <= 35) return "text-yellow-700";
  return "text-red-700";
}
function fcBg(fc: number) {
  if (fc <= 30) return "bg-green-50 border-green-200";
  if (fc <= 35) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}
function fcBarColor(fc: number) {
  if (fc <= 30) return "bg-green-500";
  if (fc <= 35) return "bg-yellow-500";
  return "bg-red-500";
}

const SUGGESTED_MULTIPLIERS = [
  { label: "Costo Alimentos 30% → Margen 70%", factor: 1 / 0.3  },
  { label: "Costo Alimentos 25% → Margen 75%", factor: 1 / 0.25 },
  { label: "Costo Alimentos 20% → Margen 80%", factor: 1 / 0.2  },
];

function loadDishes(): SavedDish[] {
  try { return JSON.parse(localStorage.getItem("zupply_dishes_v2") ?? "[]"); }
  catch { return []; }
}
function saveDishesToStorage(dishes: SavedDish[]) {
  localStorage.setItem("zupply_dishes_v2", JSON.stringify(dishes));
}

export default function CosteoPlatos() {
  const { data: inventory, isLoading } = useListInventory();
  const [savedDishes, setSavedDishes]   = useState<SavedDish[]>(loadDishes);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [dishName, setDishName]         = useState("");
  const [ingredients, setIngredients]   = useState<Ingredient[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [selectedQty, setSelectedQty]   = useState("");
  const [pvp, setPvp]                   = useState("");

  const totalCost  = ingredients.reduce((s, i) => s + i.qty * i.costPerUnit, 0);
  const pvpNum     = parseFloat(pvp) || 0;
  const foodCostPct = pvpNum > 0 ? (totalCost / pvpNum) * 100 : 0;
  const margin     = 100 - foodCostPct;

  const fcStatus = pvpNum > 0
    ? foodCostPct <= 30 ? "ideal"
    : foodCostPct <= 35 ? "aceptable"
    : "alerta"
    : null;

  const loadDishIntoEditor = (dish: SavedDish) => {
    setEditingId(dish.id);
    setDishName(dish.name);
    setIngredients(dish.ingredients);
    setPvp(String(dish.pvp));
  };

  const clearEditor = () => {
    setEditingId(null);
    setDishName("");
    setIngredients([]);
    setSelectedInventoryId("");
    setSelectedQty("");
    setPvp("");
  };

  const addIngredient = () => {
    if (!selectedInventoryId || !selectedQty) return;
    const item = inventory?.find(i => i.id === parseInt(selectedInventoryId));
    if (!item) return;
    const qty = parseFloat(selectedQty);
    if (isNaN(qty) || qty <= 0) return;
    setIngredients(prev => {
      const existing = prev.findIndex(x => x.inventoryId === item.id);
      if (existing >= 0) { const n = [...prev]; n[existing] = { ...n[existing], qty }; return n; }
      return [...prev, { inventoryId: item.id, name: item.name, unit: item.unit, qty, costPerUnit: item.costPerUnit }];
    });
    setSelectedInventoryId("");
    setSelectedQty("");
  };

  const removeIngredient = (id: number) =>
    setIngredients(prev => prev.filter(i => i.inventoryId !== id));

  const saveDish = () => {
    if (!dishName || ingredients.length === 0 || pvpNum <= 0) return;
    const dish: SavedDish = {
      id: editingId ?? crypto.randomUUID(),
      name: dishName, ingredients, totalCost, pvp: pvpNum,
      foodCostPct, createdAt: new Date().toISOString(),
    };
    setSavedDishes(prev => {
      const updated = editingId ? prev.map(d => d.id === editingId ? dish : d) : [dish, ...prev];
      saveDishesToStorage(updated);
      return updated;
    });
    clearEditor();
  };

  const deleteDish = (id: string) => {
    setSavedDishes(prev => { const u = prev.filter(d => d.id !== id); saveDishesToStorage(u); return u; });
    if (editingId === id) clearEditor();
  };

  // Sync ingredient costs when inventory changes
  useEffect(() => {
    if (!inventory) return;
    setSavedDishes(prev => {
      const updated = prev.map(dish => {
        const updatedIng = dish.ingredients.map(ing => {
          const inv = inventory.find(i => i.id === ing.inventoryId);
          return inv ? { ...ing, costPerUnit: inv.costPerUnit } : ing;
        });
        const newCost = updatedIng.reduce((s, i) => s + i.qty * i.costPerUnit, 0);
        const newFC   = dish.pvp > 0 ? (newCost / dish.pvp) * 100 : 0;
        return { ...dish, ingredients: updatedIng, totalCost: newCost, foodCostPct: newFC };
      });
      saveDishesToStorage(updated);
      return updated;
    });
  }, [inventory]);

  if (isLoading) return <div className="text-muted-foreground">Cargando inventario...</div>;

  const selectedUnit = inventory?.find(i => i.id === parseInt(selectedInventoryId))?.unit ?? "unidad";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <ChefHat className="w-8 h-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Gestor de Menú & Costeo Gastronómico</h2>
          <p className="text-sm text-muted-foreground">
            Food Cost % = Costo Total / PVP × 100 · Objetivo: ≤ 30% (margen ≥ 70%)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT: dish list ── */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Menú del Restaurante
              <Badge variant="outline">{savedDishes.length}</Badge>
            </h3>
            <Button size="sm" variant="outline" onClick={clearEditor}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo
            </Button>
          </div>

          {savedDishes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
              Sin platos guardados. Crea tu primero con el formulario.
            </div>
          ) : (
            <div className="space-y-2">
              {savedDishes.map(dish => (
                <div
                  key={dish.id}
                  onClick={() => loadDishIntoEditor(dish)}
                  className={`rounded-lg border p-3 cursor-pointer transition-all hover:shadow-sm group ${
                    editingId === dish.id ? "border-primary bg-primary/5 shadow-sm" : "hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{dish.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {dish.ingredients.length} ingredientes · Costo: {formatCOP(dish.totalCost)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); loadDishIntoEditor(dish); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-primary">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteDish(dish.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span><span className="text-muted-foreground">PVP:</span> <span className="font-medium text-green-700">{formatCOP(dish.pvp)}</span></span>
                    <span>
                      <span className="text-muted-foreground">Food Cost:</span>{" "}
                      <span className={`font-bold ${fcColor(dish.foodCostPct)}`}>{dish.foodCostPct.toFixed(1)}%</span>
                    </span>
                    {dish.foodCostPct > 35 && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                    {dish.foodCostPct <= 30 && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: creator / editor ── */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-4 flex-row items-center gap-3 space-y-0">
              <UtensilsCrossed className="w-5 h-5 text-primary" />
              <CardTitle className="text-base flex-1">
                {editingId ? `Editando: ${dishName || "..."}` : "Crear Nuevo Plato"}
              </CardTitle>
              {editingId && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearEditor}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="space-y-1">
                <Label>Nombre del Plato</Label>
                <Input value={dishName} onChange={e => setDishName(e.target.value)}
                  placeholder="Ej: Mute Santandereano, Bandeja Paisa..." />
              </div>

              {/* Add ingredient */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-semibold">Agregar ingrediente del inventario</p>
                <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecciona un ingrediente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory?.map(item => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name} — {formatCOP(item.costPerUnit)}/{item.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Cantidad ({selectedUnit})</Label>
                    <Input type="number" value={selectedQty} onChange={e => setSelectedQty(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addIngredient()}
                      placeholder="0" className="bg-white" />
                  </div>
                  <Button onClick={addIngredient} disabled={!selectedInventoryId || !selectedQty} size="sm" className="shrink-0">
                    <Plus className="w-4 h-4 mr-1" /> Agregar
                  </Button>
                </div>
              </div>

              {/* Ingredients table */}
              {ingredients.length > 0 && (
                <div className="rounded-lg border divide-y overflow-hidden">
                  <div className="grid grid-cols-5 px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="col-span-2">Ingrediente</span>
                    <span>Cantidad</span>
                    <span>Costo/ud</span>
                    <span className="text-right">Subtotal</span>
                  </div>
                  {ingredients.map(ing => {
                    const lineCost = ing.qty * ing.costPerUnit;
                    const pct = totalCost > 0 ? (lineCost / totalCost) * 100 : 0;
                    return (
                      <div key={ing.inventoryId} className="grid grid-cols-5 items-center px-3 py-2 text-sm hover:bg-muted/20 group">
                        <div className="col-span-2 flex items-center gap-2">
                          <button onClick={() => removeIngredient(ing.inventoryId)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-medium truncate">{ing.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{ing.qty} {ing.unit}</span>
                        <span className="text-xs text-muted-foreground">{formatCOP(ing.costPerUnit)}</span>
                        <div className="text-right">
                          <span className="font-medium text-xs">{formatCOP(lineCost)}</span>
                          <div className="text-xs text-muted-foreground">{pct.toFixed(0)}%</div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-5 px-3 py-2.5 bg-muted/40 text-sm font-bold">
                    <span className="col-span-4">Costo Total de Producción</span>
                    <span className="text-right text-primary">{formatCOP(totalCost)}</span>
                  </div>
                </div>
              )}

              {/* PVP & Food Cost */}
              {ingredients.length > 0 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-1">
                      <Label className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Precio de Venta al Público (PVP)
                      </Label>
                      <Input type="number" value={pvp} onChange={e => setPvp(e.target.value)}
                        placeholder="Ingresa el PVP deseado" className="text-lg font-semibold" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">PVP sugerido (costo/objetivo)</Label>
                      <div className="flex flex-col gap-1">
                        {SUGGESTED_MULTIPLIERS.map(opt => (
                          <button key={opt.label} onClick={() => setPvp(String(Math.round(totalCost * opt.factor)))}
                            disabled={totalCost === 0}
                            className="text-left text-xs px-2 py-1 rounded border hover:border-primary hover:text-primary transition-colors disabled:opacity-40">
                            {opt.label} → {formatCOP(totalCost * opt.factor)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Food Cost result card */}
                  {pvpNum > 0 && (
                    <div className={`rounded-lg border p-4 ${fcBg(foodCostPct)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4" />
                          <span className="font-semibold text-sm">Porcentaje de Costo de Alimentos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {fcStatus === "ideal"     && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {fcStatus === "aceptable" && <TrendingUp className="w-4 h-4 text-yellow-600" />}
                          {fcStatus === "alerta"    && <AlertTriangle className="w-4 h-4 text-red-600" />}
                          <span className={`text-2xl font-black ${fcColor(foodCostPct)}`}>
                            {foodCostPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Fórmula: ({formatCOP(totalCost)} / {formatCOP(pvpNum)}) × 100
                      </p>

                      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full transition-all ${fcBarColor(foodCostPct)}`}
                          style={{ width: `${Math.min(100, foodCostPct * 2)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-3">
                        <span>0%</span><span className="text-green-600 font-semibold">30% ideal</span><span className="text-red-600">35%+</span><span>50%</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-muted-foreground">Costo</p>
                          <p className="font-bold">{formatCOP(totalCost)}</p>
                        </div>
                        <div className="text-center border-x">
                          <p className="text-muted-foreground">PVP</p>
                          <p className="font-bold text-green-700">{formatCOP(pvpNum)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-muted-foreground">Margen</p>
                          <p className={`font-bold ${fcColor(foodCostPct)}`}>{margin.toFixed(1)}%</p>
                        </div>
                      </div>

                      {fcStatus === "ideal" && (
                        <p className="mt-3 text-xs text-green-700 bg-green-100 rounded px-2 py-1.5">
                          ✅ ¡Excelente! Food Cost ≤ 30%. Tu margen de ganancia es del {margin.toFixed(1)}%.
                        </p>
                      )}
                      {fcStatus === "aceptable" && (
                        <p className="mt-3 text-xs text-yellow-700 bg-yellow-100 rounded px-2 py-1.5">
                          ⚠️ Aceptable pero ajustado. Considera subir el PVP a {formatCOP(totalCost / 0.3)} para alcanzar el 30%.
                        </p>
                      )}
                      {fcStatus === "alerta" && (
                        <div className="mt-3 text-xs text-red-700 bg-red-100 rounded px-2 py-1.5">
                          🚨 Food Cost supera el 35%. <strong>Estás perdiendo dinero.</strong> Sube el PVP al menos a{" "}
                          <strong>{formatCOP(totalCost / 0.35)}</strong> (35%) o idealmente a{" "}
                          <strong>{formatCOP(totalCost / 0.3)}</strong> (30%).
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {editingId && (
                  <Button variant="outline" onClick={clearEditor} className="flex-1">
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                )}
                <Button
                  className="flex-1" size="lg"
                  disabled={!dishName || ingredients.length === 0 || pvpNum <= 0}
                  onClick={saveDish}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "Actualizar Plato" : "Guardar Plato"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
