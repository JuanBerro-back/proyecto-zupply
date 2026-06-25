import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, FileText, Plus, Trash2, Printer, CheckCircle,
  CreditCard, Banknote, Smartphone, Hash, Mail,
} from "lucide-react";

type Mode = "pos" | "electronica";

type LineItem = { id: string; desc: string; qty: number; price: number };

const QUICK_ITEMS = [
  { desc: "Mute Santandereano",   price: 22000 },
  { desc: "Hamburguesa Especial", price: 18000 },
  { desc: "Bandeja Paisa",        price: 28000 },
  { desc: "Arepa con Huevo",      price: 8000  },
  { desc: "Agua 500ml",           price: 3000  },
  { desc: "Jugo Natural",         price: 7000  },
  { desc: "Gaseosa 350ml",        price: 4000  },
  { desc: "Café Americano",       price: 5000  },
];

const IVA = 0.19;

function formatCOP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

function generateId() {
  return `FV-${Date.now().toString().slice(-6)}`;
}

// ── POS ──────────────────────────────────────────────────────────────────
function POSMode() {
  const [items, setItems]     = useState<LineItem[]>([]);
  const [method, setMethod]   = useState<"efectivo" | "tarjeta" | "nequi">("efectivo");
  const [paid, setPaid]       = useState(false);
  const [invoiceId]           = useState(generateId);
  const [cashGiven, setCashGiven] = useState("");

  const addItem = (desc: string, price: number) =>
    setItems((prev) => {
      const ex = prev.findIndex((i) => i.desc === desc);
      if (ex >= 0) {
        const n = [...prev]; n[ex] = { ...n[ex], qty: n[ex].qty + 1 }; return n;
      }
      return [...prev, { id: crypto.randomUUID(), desc, qty: 1, price }];
    });

  const changeQty = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva      = subtotal * IVA;
  const total    = subtotal + iva;
  const change   = (parseFloat(cashGiven) || 0) - total;

  if (paid) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-10">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-black">¡Venta Registrada!</h3>
          <p className="text-muted-foreground font-mono mt-1">{invoiceId}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 text-sm space-y-1 text-left">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
          <div className="flex justify-between"><span>IVA 19%</span><span>{formatCOP(iva)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1 mt-1">
            <span>Total</span><span className="text-green-700">{formatCOP(total)}</span>
          </div>
          {method === "efectivo" && change > 0 && (
            <div className="flex justify-between text-blue-700 font-semibold">
              <span>Cambio</span><span>{formatCOP(change)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground">
            <span>Método</span>
            <span className="capitalize">{method === "nequi" ? "Nequi/PSE" : method}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </Button>
          <Button className="flex-1" onClick={() => { setItems([]); setPaid(false); setCashGiven(""); }}>
            Nueva Venta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Product grid */}
      <div className="lg:col-span-3 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Toca para agregar</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ITEMS.map((item) => (
            <button
              key={item.desc}
              onClick={() => addItem(item.desc, item.price)}
              className="rounded-xl border bg-card hover:border-primary hover:shadow-sm transition-all p-4 text-left group"
            >
              <p className="font-semibold text-sm group-hover:text-primary leading-tight">{item.desc}</p>
              <p className="text-lg font-black text-green-700 mt-1">{formatCOP(item.price)}</p>
            </button>
          ))}
        </div>

        {/* Custom item */}
        <div className="rounded-xl border bg-muted/30 p-3">
          <p className="text-xs font-semibold mb-2">Agregar ítem personalizado</p>
          <CustomItemForm onAdd={(desc, price) => addItem(desc, price)} />
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2 flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <p className="font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Cuenta · <span className="font-mono text-sm text-muted-foreground">{invoiceId}</span>
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px]">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Sin productos aún</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.desc}</p>
                  <p className="text-xs text-muted-foreground">{formatCOP(item.price)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeQty(item.id, -1)}
                    className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted text-lg leading-none">−</button>
                  <span className="w-6 text-center font-bold">{item.qty}</span>
                  <button onClick={() => changeQty(item.id, 1)}
                    className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted text-lg leading-none">+</button>
                </div>
                <span className="font-semibold w-20 text-right">{formatCOP(item.price * item.qty)}</span>
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-4 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>IVA 19%</span><span>{formatCOP(iva)}</span></div>
            <div className="flex justify-between font-black text-lg"><span>Total</span><span className="text-green-700">{formatCOP(total)}</span></div>
          </div>

          <div className="flex gap-2">
            {(["efectivo", "tarjeta", "nequi"] as const).map((m) => (
              <button key={m} onClick={() => setMethod(m)}
                className={`flex-1 rounded-lg border p-2 text-xs font-semibold transition-all flex flex-col items-center gap-1 ${method === m ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground/40"}`}>
                {m === "efectivo" ? <Banknote className="w-4 h-4" /> : m === "tarjeta" ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                {m === "nequi" ? "Nequi/PSE" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {method === "efectivo" && (
            <div className="flex gap-2 items-center">
              <Label className="text-xs shrink-0">Recibido:</Label>
              <Input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)}
                placeholder="0" className="h-8 text-sm" />
              {change > 0 && (
                <span className="text-xs font-bold text-blue-600 shrink-0">Cambio: {formatCOP(change)}</span>
              )}
            </div>
          )}

          <Button className="w-full" size="lg" disabled={items.length === 0} onClick={() => setPaid(true)}>
            <CheckCircle className="w-4 h-4 mr-2" /> Cobrar {items.length > 0 ? formatCOP(total) : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomItemForm({ onAdd }: { onAdd: (desc: string, price: number) => void }) {
  const [desc, setDesc]   = useState("");
  const [price, setPrice] = useState("");
  const submit = () => {
    if (!desc || !price) return;
    onAdd(desc, parseFloat(price));
    setDesc(""); setPrice("");
  };
  return (
    <div className="flex gap-2">
      <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción" className="h-8 text-sm" />
      <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Precio" type="number" className="h-8 text-sm w-28" />
      <Button size="sm" onClick={submit} disabled={!desc || !price} className="h-8 shrink-0">
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ── Electronic Invoice ─────────────────────────────────────────────────────
function ElectronicaMode() {
  const [form, setForm] = useState({
    clientType: "nit" as "nit" | "cedula" | "email",
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
  });
  const [items, setItems]   = useState<LineItem[]>([{ id: "1", desc: "", qty: 1, price: 0 }]);
  const [issued, setIssued] = useState(false);
  const [invoiceId]         = useState(() => `FE-${Date.now().toString().slice(-7)}`);

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const updateItem = (idx: number, k: keyof LineItem, v: string | number) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [k]: v } : item));

  const addLine  = () => setItems((p) => [...p, { id: crypto.randomUUID(), desc: "", qty: 1, price: 0 }]);
  const removeLine = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva      = subtotal * IVA;
  const total    = subtotal + iva;

  const canSubmit = form.clientId && form.clientName && items.every((i) => i.desc && i.price > 0);

  if (issued) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-10">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
          <FileText className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-black">Factura Electrónica Emitida</h3>
          <p className="font-mono text-muted-foreground mt-1">{invoiceId}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-5 text-sm space-y-2 text-left">
          <p><span className="text-muted-foreground">Cliente:</span> <strong>{form.clientName}</strong></p>
          <p><span className="text-muted-foreground">{form.clientType.toUpperCase()}:</span> {form.clientId}</p>
          {form.clientEmail && <p><span className="text-muted-foreground">Email:</span> {form.clientEmail}</p>}
          <div className="border-t pt-2 mt-2 space-y-1">
            {items.map((i, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{i.qty}× {i.desc}</span>
                <span>{formatCOP(i.price * i.qty)}</span>
              </div>
            ))}
            <div className="border-t pt-1 flex justify-between font-bold">
              <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IVA 19%</span><span>{formatCOP(iva)}</span>
            </div>
            <div className="flex justify-between font-black text-base">
              <span>TOTAL</span><span className="text-green-700">{formatCOP(total)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Imprimir / PDF
          </Button>
          <Button className="flex-1" onClick={() => setIssued(false)}>Nueva Factura</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Client info */}
      <div className="rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Datos del Cliente</h3>

        <div className="flex gap-2">
          {(["nit", "cedula", "email"] as const).map((t) => (
            <button key={t} onClick={() => setField("clientType", t)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${form.clientType === t ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground/40"}`}>
              {t === "nit" ? "NIT Empresa" : t === "cedula" ? "Cédula" : "Email (Gmail)"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{form.clientType === "nit" ? "NIT (sin dígito)" : form.clientType === "cedula" ? "Número de Cédula" : "Correo Gmail"}</Label>
            <Input value={form.clientId} onChange={(e) => setField("clientId", e.target.value)}
              placeholder={form.clientType === "email" ? "cliente@gmail.com" : form.clientType === "nit" ? "900123456" : "1234567890"} />
          </div>
          <div className="space-y-1.5">
            <Label>Nombre / Razón Social</Label>
            <Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)}
              placeholder="Nombre completo o empresa" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email (envío)</Label>
            <Input type="email" value={form.clientEmail} onChange={(e) => setField("clientEmail", e.target.value)}
              placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input value={form.clientAddress} onChange={(e) => setField("clientAddress", e.target.value)}
              placeholder="Cra 27 #45-32, Bucaramanga" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> Ítems Facturados</h3>
          <Button size="sm" variant="outline" onClick={addLine}>
            <Plus className="w-4 h-4 mr-1" /> Línea
          </Button>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground uppercase px-1">
            <span className="col-span-5">Descripción</span>
            <span className="col-span-2 text-center">Cant.</span>
            <span className="col-span-3">V. Unitario</span>
            <span className="col-span-1 text-right">Total</span>
            <span className="col-span-1" />
          </div>
          {items.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
              <Input value={item.desc} onChange={(e) => updateItem(idx, "desc", e.target.value)}
                placeholder="Descripción del servicio/producto" className="h-9 text-sm col-span-5" />
              <Input type="number" value={item.qty} onChange={(e) => updateItem(idx, "qty", parseFloat(e.target.value) || 1)}
                min="1" className="h-9 text-sm col-span-2 text-center" />
              <Input type="number" value={item.price || ""} onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                placeholder="0" className="h-9 text-sm col-span-3" />
              <span className="col-span-1 text-right text-xs font-semibold">{formatCOP(item.price * item.qty)}</span>
              <button onClick={() => removeLine(item.id)} disabled={items.length === 1}
                className="col-span-1 flex justify-center text-muted-foreground hover:text-destructive disabled:opacity-30">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>IVA 19%</span><span>{formatCOP(iva)}</span></div>
          <div className="flex justify-between font-black text-lg"><span>Total a Pagar</span><span className="text-green-700">{formatCOP(total)}</span></div>
        </div>
      </div>

      <Button className="w-full" size="lg" disabled={!canSubmit} onClick={() => setIssued(true)}>
        <FileText className="w-5 h-5 mr-2" /> Emitir Factura Electrónica · {formatCOP(total)}
      </Button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Facturacion() {
  const [mode, setMode] = useState<Mode>("pos");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="w-7 h-7 text-primary" /> Módulo de Facturación
          </h2>
          <p className="text-sm text-muted-foreground">Punto de Venta POS y Factura Electrónica</p>
        </div>

        <div className="flex bg-muted p-1 rounded-lg gap-1">
          <button
            onClick={() => setMode("pos")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              mode === "pos" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt className="w-4 h-4" /> Factura POS
          </button>
          <button
            onClick={() => setMode("electronica")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${
              mode === "electronica" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" /> Factura Electrónica
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-xs text-muted-foreground items-center">
        {mode === "pos" ? (
          <>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">POS</Badge>
            Venta rápida de mostrador con cálculo de cambio y soporte para efectivo, tarjeta o Nequi.
          </>
        ) : (
          <>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">ELECTRÓNICA</Badge>
            Vinculada a NIT, Cédula o Email del cliente. Incluye IVA 19% y puede enviarse por correo.
          </>
        )}
      </div>

      {mode === "pos" ? <POSMode /> : <ElectronicaMode />}
    </div>
  );
}
