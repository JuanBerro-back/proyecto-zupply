import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, AlertTriangle, Calendar, Package } from "lucide-react";

type CatalogItem = {
  id: number;
  name: string;
  category: string;
  unit: string;
  stock: number;
  pricePerUnit: number;
  batchDate: string;
  expiryDate: string;
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function expiryBadge(dateStr: string) {
  const days = daysUntil(dateStr);
  if (days < 0)  return { label: "VENCIDO",         cls: "bg-red-600 text-white",       icon: "🚨" };
  if (days <= 3) return { label: `Vence en ${days}d`, cls: "bg-red-100 text-red-700 border border-red-300", icon: "⚠️" };
  if (days <= 7) return { label: `Vence en ${days}d`, cls: "bg-yellow-100 text-yellow-700 border border-yellow-300", icon: "⏰" };
  return { label: `${days}d restantes`, cls: "bg-green-100 text-green-700 border border-green-300", icon: "✅" };
}

const today = new Date();
const d = (offset: number) => new Date(today.getTime() + offset * 86400000).toISOString().split("T")[0];

const INIT_ITEMS: CatalogItem[] = [
  { id: 1,  name: "Carne de res 90/10",   category: "Res",         unit: "kg",  stock: 180, pricePerUnit: 29000,  batchDate: d(-3),  expiryDate: d(4)  },
  { id: 2,  name: "Carne molida",          category: "Res",         unit: "kg",  stock: 95,  pricePerUnit: 22000,  batchDate: d(-1),  expiryDate: d(2)  },
  { id: 3,  name: "Costilla de res",       category: "Res",         unit: "kg",  stock: 60,  pricePerUnit: 18000,  batchDate: d(-2),  expiryDate: d(10) },
  { id: 4,  name: "Lomo de res",           category: "Res",         unit: "kg",  stock: 40,  pricePerUnit: 37000,  batchDate: d(-1),  expiryDate: d(6)  },
  { id: 5,  name: "Pechuga de pollo",      category: "Pollo",       unit: "kg",  stock: 120, pricePerUnit: 11000,  batchDate: d(-2),  expiryDate: d(3)  },
  { id: 6,  name: "Muslo de pollo",        category: "Pollo",       unit: "kg",  stock: 85,  pricePerUnit: 8500,   batchDate: d(-3),  expiryDate: d(1)  },
  { id: 7,  name: "Chicharrón",            category: "Cerdo",       unit: "kg",  stock: 50,  pricePerUnit: 15000,  batchDate: d(-5),  expiryDate: d(-1) },
  { id: 8,  name: "Costilla cerdo ahumada",category: "Cerdo",       unit: "kg",  stock: 35,  pricePerUnit: 18000,  batchDate: d(-2),  expiryDate: d(14) },
  { id: 9,  name: "Camarón tigre pelado",  category: "Mariscos",    unit: "kg",  stock: 20,  pricePerUnit: 45000,  batchDate: d(-1),  expiryDate: d(2)  },
  { id: 10, name: "Queso costeño x kg",    category: "Lácteos",     unit: "kg",  stock: 45,  pricePerUnit: 14000,  batchDate: d(-4),  expiryDate: d(8)  },
];

type FormData = {
  name: string; category: string; unit: string;
  stock: string; pricePerUnit: string; batchDate: string; expiryDate: string;
};
const EMPTY: FormData = { name: "", category: "", unit: "", stock: "", pricePerUnit: "", batchDate: "", expiryDate: "" };

function ItemDialog({ open, onClose, editItem, onSave }: {
  open: boolean; onClose: () => void;
  editItem?: CatalogItem | null;
  onSave: (item: CatalogItem) => void;
}) {
  const [form, setForm] = useState<FormData>(
    editItem
      ? { name: editItem.name, category: editItem.category, unit: editItem.unit,
          stock: String(editItem.stock), pricePerUnit: String(editItem.pricePerUnit),
          batchDate: editItem.batchDate, expiryDate: editItem.expiryDate }
      : EMPTY
  );

  const set = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    onSave({
      id: editItem?.id ?? Date.now(),
      name: form.name, category: form.category, unit: form.unit,
      stock: parseFloat(form.stock) || 0,
      pricePerUnit: parseFloat(form.pricePerUnit) || 0,
      batchDate: form.batchDate,
      expiryDate: form.expiryDate,
    });
    onClose();
  };

  const canSave = form.name && form.category && form.unit && form.expiryDate;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? "Editar Producto" : "Nuevo Producto del Catálogo"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-1">
            <Label>Nombre del producto</Label>
            <Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ej: Carne de res 90/10" />
          </div>
          <div className="space-y-1">
            <Label>Categoría</Label>
            <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Res, Pollo..." />
          </div>
          <div className="space-y-1">
            <Label>Unidad</Label>
            <Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="kg, lt, unidad" />
          </div>
          <div className="space-y-1">
            <Label>Stock disponible</Label>
            <Input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Precio por unidad ($)</Label>
            <Input type="number" value={form.pricePerUnit} onChange={e => set("pricePerUnit", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1">
            <Label>Fecha de lote</Label>
            <Input type="date" value={form.batchDate} onChange={e => set("batchDate", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-red-500" /> Fecha de vencimiento *</Label>
            <Input type="date" value={form.expiryDate} onChange={e => set("expiryDate", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSave}>{editItem ? "Actualizar" : "Agregar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProveedorInventario() {
  const [items, setItems] = useState<CatalogItem[]>(INIT_ITEMS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<CatalogItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filter, setFilter] = useState("Todos");

  const save = (item: CatalogItem) => {
    setItems(prev =>
      editItem ? prev.map(i => i.id === item.id ? item : i) : [item, ...prev]
    );
  };

  const deleteItem = () => {
    if (deleteId == null) return;
    setItems(prev => prev.filter(i => i.id !== deleteId));
    setDeleteId(null);
  };

  const urgent = items.filter(i => daysUntil(i.expiryDate) <= 3);
  const categories = ["Todos", ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = filter === "Todos" ? items : items.filter(i => i.category === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Inventario de Catálogo
          </h2>
          <p className="text-sm text-muted-foreground">FEFO — Control obligatorio de lotes y fechas de vencimiento</p>
        </div>
        <Button onClick={() => { setEditItem(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Agregar Producto
        </Button>
      </div>

      {/* FEFO alerts */}
      {urgent.length > 0 && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            ⚠️ Alerta FEFO — {urgent.length} producto(s) vence(n) en ≤ 3 días. Despacha primero.
          </div>
          <div className="flex flex-wrap gap-2">
            {urgent.map(item => {
              const days = daysUntil(item.expiryDate);
              return (
                <div key={item.id} className="bg-white border border-red-200 rounded-lg px-3 py-2 text-xs">
                  <span className="font-bold">{item.name}</span>
                  <span className="text-red-600 ml-2 font-semibold">
                    {days < 0 ? "VENCIDO" : days === 0 ? "Vence HOY" : `Vence en ${days}d`}
                  </span>
                  <span className="text-muted-foreground ml-2">{item.stock} {item.unit} en stock</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              filter === cat
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
            }`}
          >{cat}</button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Precio/Unidad</TableHead>
                <TableHead>Fecha Lote</TableHead>
                <TableHead>Vencimiento (FEFO)</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered
                .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))
                .map(item => {
                  const exp = expiryBadge(item.expiryDate);
                  return (
                    <TableRow key={item.id} className={daysUntil(item.expiryDate) <= 0 ? "bg-red-50" : daysUntil(item.expiryDate) <= 3 ? "bg-red-50/50" : ""}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.category}</TableCell>
                      <TableCell className="font-bold">
                        {item.stock} <span className="text-xs text-muted-foreground font-normal">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-sm">${item.pricePerUnit.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.batchDate}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${exp.cls}`}>
                          {exp.icon} {exp.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => { setEditItem(item); setModalOpen(true); }}
                          >
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

      <ItemDialog
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditItem(null); }}
        editItem={editItem}
        onSave={save}
      />

      <AlertDialog open={deleteId != null} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>El producto será eliminado del catálogo permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
