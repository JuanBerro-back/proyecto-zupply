import { useState, useCallback } from "react";
import {
  useListInventory,
  useGetInventoryPredictions,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  getListInventoryQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Brain, TrendingDown, TrendingUp, Minus, Plus, Pencil, Trash2,
  AlertTriangle, Calendar,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// ── FEFO expiry date helpers (localStorage per item id) ───────────────────
const EXPIRY_KEY = "zupply_expiry_v1";

function loadExpiry(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(EXPIRY_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveExpiry(map: Record<number, string>) {
  localStorage.setItem(EXPIRY_KEY, JSON.stringify(map));
}
function daysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function expiryInfo(dateStr: string | undefined) {
  const days = daysUntil(dateStr);
  if (days === null) return null;
  if (days < 0)  return { label: "VENCIDO",          cls: "bg-red-600 text-white",                            urgent: true  };
  if (days === 0) return { label: "Vence HOY",        cls: "bg-red-100 text-red-700 border border-red-300",    urgent: true  };
  if (days <= 3)  return { label: `Vence en ${days}d`,cls: "bg-red-100 text-red-700 border border-red-300",    urgent: true  };
  if (days <= 7)  return { label: `${days}d restantes`,cls: "bg-yellow-100 text-yellow-700 border border-yellow-300", urgent: false };
  return { label: `${days}d restantes`, cls: "bg-green-100 text-green-700 border border-green-300", urgent: false };
}

// ── Types ─────────────────────────────────────────────────────────────────
type InventoryItem = {
  id: number; name: string; category: string; unit: string;
  currentStock: number; minStock: number; maxStock: number;
  costPerUnit: number; avgDailyUsage: number; stockStatus: string;
};

const EMPTY_FORM = {
  name: "", category: "", unit: "",
  currentStock: "", minStock: "", maxStock: "",
  avgDailyUsage: "", costPerUnit: "", expiryDate: "",
};

// ── Form dialog ───────────────────────────────────────────────────────────
function InventoryFormDialog({ open, onClose, editItem, expiryMap, onExpiryChange }: {
  open: boolean; onClose: () => void;
  editItem?: InventoryItem | null;
  expiryMap: Record<number, string>;
  onExpiryChange: (id: number, val: string) => void;
}) {
  const isEdit = !!editItem;
  const [form, setForm] = useState(
    editItem
      ? { name: editItem.name, category: editItem.category, unit: editItem.unit,
          currentStock: String(editItem.currentStock), minStock: String(editItem.minStock),
          maxStock: String(editItem.maxStock), avgDailyUsage: String(editItem.avgDailyUsage),
          costPerUnit: String(editItem.costPerUnit),
          expiryDate: expiryMap[editItem.id] ?? "" }
      : EMPTY_FORM
  );

  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const queryClient = useQueryClient();
  const { toast }   = useToast();

  const setField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    const payload = {
      name: form.name, category: form.category, unit: form.unit,
      currentStock: parseFloat(form.currentStock) || 0,
      minStock:     parseFloat(form.minStock)     || 0,
      maxStock:     parseFloat(form.maxStock)     || 0,
      avgDailyUsage:parseFloat(form.avgDailyUsage)|| 0,
      costPerUnit:  parseFloat(form.costPerUnit)  || 0,
    };

    const afterSave = (id: number) => {
      if (form.expiryDate) onExpiryChange(id, form.expiryDate);
      queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      toast({ title: isEdit ? "Ítem actualizado." : "Ítem creado." });
      onClose();
    };

    if (isEdit && editItem) {
      updateItem.mutate({ id: editItem.id, data: payload }, { onSuccess: () => afterSave(editItem.id) });
    } else {
      createItem.mutate({ data: payload }, { onSuccess: (res) => afterSave((res as any).id ?? Date.now()) });
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Ítem de Inventario" : "Agregar Nuevo Ítem"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-1">
            <Label>Nombre</Label>
            <Input value={form.name} onChange={e => setField("name", e.target.value)} placeholder="Ej: Harina de trigo" />
          </div>
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Input value={form.category} onChange={e => setField("category", e.target.value)} placeholder="Ej: Granos" />
          </div>
          <div className="space-y-1">
            <Label>Unidad</Label>
            <Input value={form.unit} onChange={e => setField("unit", e.target.value)} placeholder="kg, litro, unidad..." />
          </div>
          <div className="space-y-1">
            <Label>Stock Actual</Label>
            <Input type="number" value={form.currentStock} onChange={e => setField("currentStock", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Stock Mínimo</Label>
            <Input type="number" value={form.minStock} onChange={e => setField("minStock", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Stock Máximo</Label>
            <Input type="number" value={form.maxStock} onChange={e => setField("maxStock", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Uso Diario Promedio</Label>
            <Input type="number" value={form.avgDailyUsage} onChange={e => setField("avgDailyUsage", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Costo por Unidad ($)</Label>
            <Input type="number" value={form.costPerUnit} onChange={e => setField("costPerUnit", e.target.value)} placeholder="0" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-500" />
              Fecha de Vencimiento (FEFO)
            </Label>
            <Input
              type="date"
              value={form.expiryDate}
              onChange={e => setField("expiryDate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              FEFO: se prioriza el despacho del ítem que vence primero.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !form.name || !form.category || !form.unit}>
            {isPending ? "Guardando..." : isEdit ? "Actualizar" : "Crear Ítem"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function Inventario() {
  const { data: inventory, isLoading } = useListInventory();
  const [showPredictions, setShowPredictions] = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editItem, setEditItem]     = useState<InventoryItem | null>(null);
  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [expiryMap, setExpiryMap]   = useState<Record<number, string>>(loadExpiry);
  const { data: predictions, isLoading: loadingPredictions, refetch } = useGetInventoryPredictions({ query: { enabled: false } });
  const deleteItem   = useDeleteInventoryItem();
  const queryClient  = useQueryClient();
  const { toast }    = useToast();

  const handleRunAI  = () => { setShowPredictions(true); refetch(); };
  const handleEdit   = (item: InventoryItem) => { setEditItem(item); setModalOpen(true); };
  const handleAddNew = () => { setEditItem(null); setModalOpen(true); };
  const handleCloseModal = () => { setModalOpen(false); setEditItem(null); };

  const handleExpiryChange = useCallback((id: number, val: string) => {
    setExpiryMap(prev => { const next = { ...prev, [id]: val }; saveExpiry(next); return next; });
  }, []);

  const handleDelete = () => {
    if (deleteId == null) return;
    deleteItem.mutate({ id: deleteId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
        toast({ title: "Ítem eliminado del inventario." });
        setDeleteId(null);
      },
    });
  };

  if (isLoading) return <div className="text-muted-foreground">Cargando inventario...</div>;

  const urgentItems = inventory?.filter(item => {
    const d = daysUntil(expiryMap[item.id]);
    return d !== null && d <= 3;
  }) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Inventario Inteligente</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddNew}>
            <Plus className="w-4 h-4 mr-2" /> Agregar Ítem
          </Button>
          <Button
            onClick={handleRunAI}
            disabled={loadingPredictions}
            className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white border-0"
          >
            <Brain className="w-5 h-5 mr-2" /> Predicción IA
          </Button>
        </div>
      </div>

      {/* FEFO alerts */}
      {urgentItems.length > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            Alerta FEFO — {urgentItems.length} producto(s) vence(n) en ≤ 3 días. Usa primero.
          </div>
          <div className="flex flex-wrap gap-2">
            {urgentItems.map(item => {
              const days = daysUntil(expiryMap[item.id]);
              return (
                <div key={item.id} className="bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-red-600 font-semibold">
                    {days !== null && days < 0 ? "VENCIDO" : days === 0 ? "HOY" : `${days}d`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI predictions */}
      {showPredictions && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" /> Recomendaciones de IA
          </h3>
          {loadingPredictions ? (
            <div className="text-muted-foreground">Calculando proyecciones...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {predictions?.map((pred, i) => (
                <Card key={i} className={`border-l-4 ${pred.urgency === "high" ? "border-l-destructive" : pred.urgency === "medium" ? "border-l-yellow-500" : "border-l-green-500"}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm">{pred.itemName}</h4>
                      <Badge variant={pred.urgency === "high" ? "destructive" : "outline"}>{pred.urgency.toUpperCase()}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{pred.recommendation}</p>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Pedir: <span className="text-primary">{pred.recommendedOrderQty} {pred.unit}</span></span>
                      {pred.trend === "increasing" ? <TrendingUp className="w-4 h-4 text-destructive" /> : pred.trend === "decreasing" ? <TrendingDown className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-muted-foreground" />}
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
                <TableHead>Stock</TableHead>
                <TableHead>Mín / Máx</TableHead>
                <TableHead>Costo/Unidad</TableHead>
                <TableHead>Vencimiento (FEFO)</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory
                ?.slice()
                .sort((a, b) => {
                  const da = daysUntil(expiryMap[a.id]) ?? 9999;
                  const db = daysUntil(expiryMap[b.id]) ?? 9999;
                  return da - db;
                })
                .map(item => {
                  const exp = expiryInfo(expiryMap[item.id]);
                  return (
                    <TableRow key={item.id} className={exp?.urgent ? "bg-red-50/60" : ""}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.category}</TableCell>
                      <TableCell className="font-bold">
                        {item.currentStock} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.minStock} / {item.maxStock}</TableCell>
                      <TableCell className="text-sm">${item.costPerUnit.toLocaleString()}</TableCell>
                      <TableCell>
                        {exp ? (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${exp.cls}`}>
                            {exp.urgent && <AlertTriangle className="w-3 h-3" />}
                            {exp.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.stockStatus === "critical" ? "destructive" : item.stockStatus === "low" ? "secondary" : "default"}
                          className={item.stockStatus === "low" ? "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30" : ""}
                        >
                          {item.stockStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InventoryFormDialog
        open={modalOpen}
        onClose={handleCloseModal}
        editItem={editItem}
        expiryMap={expiryMap}
        onExpiryChange={handleExpiryChange}
      />

      <AlertDialog open={deleteId != null} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ítem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ítem será eliminado permanentemente del inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
