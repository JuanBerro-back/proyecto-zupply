import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Receipt, FileText, Plus, Trash2, CheckCircle,
  CreditCard, Banknote, Smartphone, Hash, Mail,
  UtensilsCrossed, Clock, ChefHat, Table, Send,
} from "lucide-react";
import { FacturaTicketModal, type TicketData, type TicketItem } from "./FacturaTicketModal";

// ── Constants ─────────────────────────────────────────────────────────────
const IVA = 0.19;
const RESTAURANT_NAME = "Zupply IA - Sabores de Bucaramanga";

function formatCOP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-5)}`;
}

// ── Shared menu (mirrors CosteoPlatos dishes) ─────────────────────────────
const MENU = [
  { id: "m1", name: "Mute Santandereano",  price: 22000 },
  { id: "m2", name: "Hamburguesa Especial", price: 18000 },
  { id: "m3", name: "Bandeja Paisa",        price: 28000 },
  { id: "m4", name: "Arepa con Huevo",      price: 8000  },
  { id: "m5", name: "Caldo de Costilla",    price: 16000 },
  { id: "m6", name: "Sancocho de Gallina",  price: 24000 },
  { id: "m7", name: "Agua 500ml",           price: 3000  },
  { id: "m8", name: "Jugo Natural",         price: 7000  },
  { id: "m9", name: "Gaseosa 350ml",        price: 4000  },
  { id: "m10",name: "Café Americano",       price: 5000  },
];

// ── Tab types ─────────────────────────────────────────────────────────────
type TabId = "comandas" | "pos" | "electronica";

// ══════════════════════════════════════════════════════════════════════════
// COMANDAS DE MESA
// ══════════════════════════════════════════════════════════════════════════
type ComandaStatus = "pendiente" | "pagando" | "pagada";

type Comanda = {
  id: string;
  serial: number;
  mesero: string;
  mesa: number | string;
  items: { menuId: string; name: string; qty: number; price: number }[];
  total: number;
  status: ComandaStatus;
  timestamp: string;
  notes: string;
};

let serialCounter = 1;

function ComandasTab() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [form, setForm] = useState({
    mesero: "", mesa: "", notes: "",
    selections: {} as Record<string, number>,
  });
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [payMode, setPayMode] = useState<"pos" | "electronica" | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [elEmail, setElEmail] = useState("");
  const [elName, setElName] = useState("");
  const [elId, setElId] = useState("");

  const setField = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const setQty = (menuId: string, qty: number) =>
    setForm((f) => ({
      ...f,
      selections: qty > 0 ? { ...f.selections, [menuId]: qty } : (() => {
        const s = { ...f.selections }; delete s[menuId]; return s;
      })(),
    }));

  const selectedItems = MENU.filter((m) => (form.selections[m.id] ?? 0) > 0);
  const comandaTotal  = selectedItems.reduce((s, m) => s + m.price * (form.selections[m.id] ?? 0), 0);

  const handleAddComanda = () => {
    if (!form.mesero || !form.mesa || selectedItems.length === 0) return;
    const comanda: Comanda = {
      id:        generateId("CMD"),
      serial:    serialCounter++,
      mesero:    form.mesero,
      mesa:      form.mesa,
      items:     selectedItems.map((m) => ({ menuId: m.id, name: m.name, qty: form.selections[m.id], price: m.price })),
      total:     comandaTotal,
      status:    "pendiente",
      notes:     form.notes,
      timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
    };
    setComandas((p) => [comanda, ...p]);
    setForm({ mesero: "", mesa: "", notes: "", selections: {} });
  };

  const openPayment = (c: Comanda) => {
    setPayingId(c.id);
    setPayMode(null);
    setElEmail(""); setElName(""); setElId("");
  };

  const confirmPay = (c: Comanda) => {
    const id = payMode === "electronica"
      ? generateId("FE")
      : generateId("FV");

    const data: TicketData = {
      invoiceId:     id,
      mode:          payMode!,
      restaurantName: RESTAURANT_NAME,
      mesa:          c.mesa,
      mesero:        c.mesero,
      items:         c.items.map((i) => ({ desc: i.name, qty: i.qty, price: i.price })),
      ivaRate:       IVA,
      clientName:    payMode === "electronica" ? elName  : undefined,
      clientId:      payMode === "electronica" ? elId    : undefined,
      clientIdType:  "cedula",
      clientEmail:   payMode === "electronica" ? elEmail : undefined,
      paymentMethod: "Efectivo",
    };
    setComandas((prev) =>
      prev.map((x) => x.id === c.id ? { ...x, status: "pagada" } : x)
    );
    setPayingId(null);
    setTicketData(data);
    setTicketOpen(true);
  };

  const activas = comandas.filter((c) => c.status !== "pagada");
  const pagadas = comandas.filter((c) => c.status === "pagada");
  const payingComanda = comandas.find((c) => c.id === payingId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Order form ─────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-xl border bg-card p-4 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" /> Nueva Comanda
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mesero / Cajero</Label>
              <Input value={form.mesero} onChange={(e) => setField("mesero", e.target.value)}
                placeholder="Nombre" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs flex items-center gap-1"><Table className="w-3 h-3" /> Mesa N°</Label>
              <Input value={form.mesa} onChange={(e) => setField("mesa", e.target.value)}
                placeholder="1" type="text" className="h-9 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Seleccionar platos</Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
              {MENU.map((item) => {
                const qty = form.selections[item.id] ?? 0;
                return (
                  <div key={item.id}
                    className={`rounded-lg border p-2 transition-all text-xs ${qty > 0 ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"}`}>
                    <p className="font-medium leading-tight truncate">{item.name}</p>
                    <p className="text-green-700 font-bold">{formatCOP(item.price)}</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button onClick={() => setQty(item.id, Math.max(0, qty - 1))}
                        className="w-5 h-5 rounded border flex items-center justify-center hover:bg-muted text-sm leading-none font-bold">−</button>
                      <span className="w-4 text-center font-bold">{qty}</span>
                      <button onClick={() => setQty(item.id, qty + 1)}
                        className="w-5 h-5 rounded border flex items-center justify-center hover:bg-muted text-sm leading-none font-bold">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notas para cocina</Label>
            <Input value={form.notes} onChange={(e) => setField("notes", e.target.value)}
              placeholder="Sin cebolla, término 3/4..." className="h-9 text-sm" />
          </div>

          {selectedItems.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-2 text-xs space-y-0.5">
              {selectedItems.map((i) => (
                <div key={i.id} className="flex justify-between">
                  <span>{form.selections[i.id]}× {i.name}</span>
                  <span className="font-bold">{formatCOP(i.price * form.selections[i.id])}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between font-black text-sm">
                <span>Total</span><span className="text-green-700">{formatCOP(comandaTotal)}</span>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={handleAddComanda}
            disabled={!form.mesero || !form.mesa || selectedItems.length === 0}>
            <Plus className="w-4 h-4 mr-2" /> Enviar Comanda a Cocina
          </Button>
        </div>
      </div>

      {/* ── Active comandas ─────────────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            Comandas activas ({activas.length})
          </p>
          {pagadas.length > 0 && (
            <span className="text-xs text-muted-foreground">{pagadas.length} liquidadas hoy</span>
          )}
        </div>

        {activas.length === 0 && (
          <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center text-muted-foreground">
            <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay comandas activas</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activas.map((c) => (
            <div key={c.id}
              className="rounded-xl border-2 border-yellow-300 bg-gradient-to-b from-yellow-50 to-white shadow-sm p-4 space-y-3 font-mono text-sm"
              style={{ fontFamily: "'Courier New', monospace" }}>

              {/* Comanda header */}
              <div className="flex items-start justify-between border-b border-dashed border-yellow-400 pb-2">
                <div>
                  <p className="font-black text-lg">#{String(c.serial).padStart(3, "0")}</p>
                  <p className="text-xs text-gray-500">{new Date().toLocaleDateString("es-CO")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">Mesa {c.mesa}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" /> {c.timestamp}
                  </div>
                </div>
              </div>

              <div className="text-xs">
                <span className="font-semibold">Mesero: </span>{c.mesero}
              </div>

              {/* Items */}
              <div className="space-y-0.5 text-xs border-b border-dashed border-gray-300 pb-2">
                {c.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.qty}x {item.name}</span>
                    <span className="font-semibold">{formatCOP(item.price * item.qty)}</span>
                  </div>
                ))}
                {c.notes && (
                  <p className="text-gray-400 text-xs mt-1 italic">* {c.notes}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-black text-base text-green-700">{formatCOP(c.total)}</span>
                <Badge className="bg-yellow-400 text-yellow-900 border border-yellow-500 font-bold text-xs animate-pulse">
                  PENDIENTE DE PAGO
                </Badge>
              </div>

              <Button size="sm" className="w-full h-8 text-xs bg-green-600 hover:bg-green-500 font-bold"
                onClick={() => openPayment(c)}>
                <Receipt className="w-3.5 h-3.5 mr-1" /> Proceder al Pago
              </Button>
            </div>
          ))}
        </div>

        {/* Completed today */}
        {pagadas.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Liquidadas hoy</p>
            {pagadas.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs rounded-lg border bg-muted/30 px-3 py-2 opacity-70">
                <span className="font-mono font-bold">#{String(c.serial).padStart(3, "0")} — Mesa {c.mesa}</span>
                <span className="text-muted-foreground">{c.mesero}</span>
                <span className="font-semibold text-green-700">{formatCOP(c.total)}</span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3.5 h-3.5" /> Pagada
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Payment dialog ─────────────────────────────────────────────── */}
      {payingComanda && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setPayingId(null); }}>
          <div className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="font-black text-lg">Liquidar Mesa {payingComanda.mesa}</h3>
              <p className="text-muted-foreground text-sm">
                Comanda #{String(payingComanda.serial).padStart(3, "0")} —
                Total: <strong className="text-green-700">{formatCOP(payingComanda.total)}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPayMode("pos")}
                className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${payMode === "pos" ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground/40"}`}>
                <Receipt className="w-5 h-5" /> Factura POS
                <span className="text-xs text-muted-foreground font-normal">Ticket rápido</span>
              </button>
              <button onClick={() => setPayMode("electronica")}
                className={`rounded-xl border-2 p-3 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${payMode === "electronica" ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground/40"}`}>
                <FileText className="w-5 h-5" /> Factura Electrónica
                <span className="text-xs text-muted-foreground font-normal">Con CUFE + email</span>
              </button>
            </div>

            {payMode === "electronica" && (
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre del cliente</Label>
                  <Input value={elName} onChange={(e) => setElName(e.target.value)} placeholder="Nombre completo" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cédula o NIT</Label>
                  <Input value={elId} onChange={(e) => setElId(e.target.value)} placeholder="1234567890" className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email (envío de factura)</Label>
                  <Input type="email" value={elEmail} onChange={(e) => setElEmail(e.target.value)} placeholder="cliente@gmail.com" className="h-9 text-sm" />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setPayingId(null)}>Cancelar</Button>
              <Button className="flex-1 font-bold" onClick={() => confirmPay(payingComanda)}
                disabled={!payMode || (payMode === "electronica" && !elEmail)}>
                <CheckCircle className="w-4 h-4 mr-1" /> Emitir Factura
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ticket modal ────────────────────────────────────────────────── */}
      {ticketData && (
        <FacturaTicketModal
          isOpen={ticketOpen}
          onClose={() => setTicketOpen(false)}
          data={ticketData}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// POS TAB
// ══════════════════════════════════════════════════════════════════════════
type LineItem = { id: string; desc: string; qty: number; price: number };

function POSTab() {
  const [items, setItems]   = useState<LineItem[]>([]);
  const [method, setMethod] = useState<"efectivo" | "tarjeta" | "nequi">("efectivo");
  const [cashGiven, setCashGiven] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [invoiceId] = useState(() => generateId("FV"));

  const addItem = (desc: string, price: number) =>
    setItems((prev) => {
      const ex = prev.findIndex((i) => i.desc === desc);
      if (ex >= 0) { const n = [...prev]; n[ex] = { ...n[ex], qty: n[ex].qty + 1 }; return n; }
      return [...prev, { id: crypto.randomUUID(), desc, qty: 1, price }];
    });

  const changeQty = (id: string, d: number) =>
    setItems((p) => p.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + d) } : i));

  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva      = subtotal * IVA;
  const total    = subtotal + iva;
  const change   = (parseFloat(cashGiven) || 0) - total;

  const ticketData: TicketData = {
    invoiceId,
    mode: "pos",
    restaurantName: RESTAURANT_NAME,
    items: items.map((i) => ({ desc: i.desc, qty: i.qty, price: i.price })),
    ivaRate: IVA,
    paymentMethod: method === "nequi" ? "Nequi/PSE" : method.charAt(0).toUpperCase() + method.slice(1),
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Product grid */}
      <div className="lg:col-span-3 space-y-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menú — toca para agregar</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {MENU.map((item) => (
            <button key={item.id} onClick={() => addItem(item.name, item.price)}
              className="rounded-xl border bg-card hover:border-primary hover:shadow-sm transition-all p-4 text-left group">
              <p className="font-semibold text-sm group-hover:text-primary leading-tight">{item.name}</p>
              <p className="text-lg font-black text-green-700 mt-1">{formatCOP(item.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:col-span-2 flex flex-col border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <p className="font-bold flex items-center gap-2">
            <Receipt className="w-4 h-4" /> Cuenta · <span className="font-mono text-sm text-muted-foreground">{invoiceId}</span>
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[140px]">
          {items.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Sin productos aún</p>
          ) : items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.desc}</p>
                <p className="text-xs text-muted-foreground">{formatCOP(item.price)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQty(item.id, -1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted">−</button>
                <span className="w-5 text-center font-bold text-sm">{item.qty}</span>
                <button onClick={() => changeQty(item.id, 1)} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted">+</button>
              </div>
              <span className="w-20 text-right font-semibold text-sm">{formatCOP(item.price * item.qty)}</span>
              <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
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
                {m === "nequi" ? "Nequi" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
          {method === "efectivo" && (
            <div className="flex gap-2 items-center">
              <Label className="text-xs shrink-0">Recibido:</Label>
              <Input type="number" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} placeholder="0" className="h-8 text-sm" />
              {change > 0 && <span className="text-xs font-bold text-blue-600 shrink-0">Cambio: {formatCOP(change)}</span>}
            </div>
          )}
          <Button className="w-full" size="lg" disabled={items.length === 0} onClick={() => setTicketOpen(true)}>
            <CheckCircle className="w-4 h-4 mr-2" /> Cobrar {items.length > 0 ? formatCOP(total) : ""}
          </Button>
        </div>
      </div>

      <FacturaTicketModal isOpen={ticketOpen} onClose={() => setTicketOpen(false)} data={ticketData} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ELECTRONIC INVOICE TAB
// ══════════════════════════════════════════════════════════════════════════
type ELineItem = { id: string; desc: string; qty: number; price: number };

function ElectronicaTab() {
  const [form, setForm] = useState({
    clientType: "nit" as "nit" | "cedula" | "email",
    clientId: "", clientName: "", clientEmail: "", clientAddress: "",
  });
  const [items, setItems] = useState<ELineItem[]>([{ id: "1", desc: "", qty: 1, price: 0 }]);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [invoiceId] = useState(() => generateId("FE"));

  const setField = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const updateItem = (idx: number, k: keyof ELineItem, v: string | number) =>
    setItems((p) => p.map((item, i) => i === idx ? { ...item, [k]: v } : item));
  const addLine    = () => setItems((p) => [...p, { id: crypto.randomUUID(), desc: "", qty: 1, price: 0 }]);
  const removeLine = (id: string) => setItems((p) => p.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva      = subtotal * IVA;
  const total    = subtotal + iva;
  const canSubmit = form.clientId && form.clientName && form.clientEmail && items.every((i) => i.desc && i.price > 0);

  const ticketData: TicketData = {
    invoiceId,
    mode: "electronica",
    restaurantName: RESTAURANT_NAME,
    items: items.map((i) => ({ desc: i.desc, qty: i.qty, price: i.price })),
    ivaRate: IVA,
    clientName:    form.clientName,
    clientId:      form.clientId,
    clientIdType:  form.clientType,
    clientEmail:   form.clientEmail,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Client info */}
      <div className="rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Datos del Cliente</h3>
        <div className="flex gap-2">
          {(["nit", "cedula", "email"] as const).map((t) => (
            <button key={t} onClick={() => setField("clientType", t)}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${form.clientType === t ? "border-primary bg-primary/5 text-primary" : "hover:border-muted-foreground/40"}`}>
              {t === "nit" ? "NIT Empresa" : t === "cedula" ? "Cédula" : "Gmail"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{form.clientType === "email" ? "Correo Gmail" : form.clientType === "nit" ? "NIT" : "Cédula"}</Label>
            <Input value={form.clientId} onChange={(e) => setField("clientId", e.target.value)}
              placeholder={form.clientType === "email" ? "cliente@gmail.com" : form.clientType === "nit" ? "900123456" : "1234567890"} />
          </div>
          <div className="space-y-1.5">
            <Label>Nombre / Razón Social</Label>
            <Input value={form.clientName} onChange={(e) => setField("clientName", e.target.value)} placeholder="Nombre completo" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Email (envío de factura)</Label>
            <Input type="email" value={form.clientEmail} onChange={(e) => setField("clientEmail", e.target.value)} placeholder="correo@ejemplo.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Dirección</Label>
            <Input value={form.clientAddress} onChange={(e) => setField("clientAddress", e.target.value)} placeholder="Cra 27 #45-32, Bucaramanga" />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" /> Ítems Facturados</h3>
          <Button size="sm" variant="outline" onClick={addLine}><Plus className="w-4 h-4 mr-1" /> Línea</Button>
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
                placeholder="Servicio / producto" className="h-9 text-sm col-span-5" />
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
          <div className="flex justify-between font-black text-lg"><span>Total</span><span className="text-green-700">{formatCOP(total)}</span></div>
        </div>
      </div>

      <Button className="w-full" size="lg" disabled={!canSubmit} onClick={() => setTicketOpen(true)}>
        <Send className="w-5 h-5 mr-2" /> Emitir y Enviar Factura Electrónica · {formatCOP(total)}
      </Button>

      <FacturaTicketModal isOpen={ticketOpen} onClose={() => setTicketOpen(false)} data={ticketData} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════
const TABS: { id: TabId; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "comandas",    label: "Comandas de Mesa", icon: ChefHat },
  { id: "pos",         label: "Caja POS",          icon: Receipt  },
  { id: "electronica", label: "Factura Electrónica", icon: FileText },
];

export default function Facturacion() {
  const [tab, setTab] = useState<TabId>("comandas");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="w-7 h-7 text-primary" /> Módulo de Facturación
        </h2>
        <p className="text-sm text-muted-foreground">
          Comandas de cocina · POS · Factura Electrónica con envío por correo
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex bg-muted p-1 rounded-xl gap-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "comandas"    && <ComandasTab />}
      {tab === "pos"         && <POSTab />}
      {tab === "electronica" && <ElectronicaTab />}
    </div>
  );
}
