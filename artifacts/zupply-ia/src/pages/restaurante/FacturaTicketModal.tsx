/**
 * FacturaTicketModal — Thermal receipt modal with EmailJS integration
 *
 * To enable real email sending:
 *  1. Create a free account at https://www.emailjs.com/
 *  2. Add a service (Gmail, Outlook, etc.)
 *  3. Create a template with variables: {{to_email}}, {{to_name}}, {{invoice_id}},
 *     {{restaurant_name}}, {{invoice_date}}, {{items_list}}, {{subtotal}},
 *     {{iva_label}}, {{iva_amount}}, {{total}}, {{cufe}}
 *  4. Set your keys below or use VITE_ env vars in Replit Secrets.
 */

// ── EmailJS credentials — replace or set as Replit Secrets ───────────────
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || "YOUR_PUBLIC_KEY";

import { useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { X, Printer, Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TicketMode = "pos" | "electronica";

export type TicketItem = {
  desc: string;
  qty: number;
  price: number;
};

export type TicketData = {
  invoiceId: string;
  mode: TicketMode;
  restaurantName?: string;
  mesa?: string | number;
  mesero?: string;
  items: TicketItem[];
  ivaRate?: number;   // default 0.19
  clientName?: string;
  clientId?: string;
  clientIdType?: "nit" | "cedula" | "email";
  clientEmail?: string;
  paymentMethod?: string;
};

type SendStatus = "idle" | "sending" | "success" | "error";

function formatCOP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

function padEnd(str: string, len: number) {
  return (str + " ".repeat(len)).slice(0, len);
}

function padStart(str: string, len: number) {
  return (" ".repeat(len) + str).slice(-len);
}

function ticketLine(left: string, right: string, total = 38) {
  const gap = total - left.length - right.length;
  return left + (gap > 0 ? ".".repeat(gap) : " ") + right;
}

const DASH38 = "─".repeat(38);
const WAVE38 = "═".repeat(38);

// ── Thermal ticket renderer (plain strings for both screen and email) ─────
function buildTicketLines(d: TicketData): string[] {
  const ivaRate = d.ivaRate ?? 0.19;
  const ivaLabel = ivaRate === 0.08 ? "Impoconsumo 8%" : "IVA 19%";
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva = subtotal * ivaRate;
  const total = subtotal + iva;
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
  const cufe = d.mode === "electronica"
    ? `${d.invoiceId}-${Date.now().toString(36).toUpperCase()}-DIAN`
    : "";

  const lines: string[] = [];
  lines.push(WAVE38);
  lines.push("  ZUPPLY IA - SABORES DE BGA  ");
  lines.push("    Surtesoft ERP · v2.0      ");
  lines.push("  NIT: 900.123.456-7          ");
  lines.push("  Cra 27 #45-32, Cabecera BGA ");
  lines.push("  Tel: (607) 634-5678         ");
  lines.push(WAVE38);

  lines.push(d.mode === "electronica" ? "    FACTURA DE VENTA ELECTRÓNICA" : "        RECIBO DE CAJA POS      ");
  lines.push(DASH38);
  lines.push(`  No. ${d.invoiceId}`);
  lines.push(`  Fecha: ${dateStr}   Hora: ${timeStr}`);
  if (d.mesa)   lines.push(`  Mesa: ${d.mesa}`);
  if (d.mesero) lines.push(`  Atendido por: ${d.mesero}`);
  lines.push(DASH38);

  // Items
  lines.push("  CANT  DESCRIPCION          VALOR");
  lines.push(DASH38);
  d.items.forEach((item) => {
    const qty   = padEnd(String(item.qty), 5);
    const name  = padEnd(item.desc, 18);
    const total = padStart(formatCOP(item.price * item.qty), 9);
    lines.push(`  ${qty}${name}${total}`);
    const unit = padStart(`(${formatCOP(item.price)} c/u)`, 36);
    lines.push(unit);
  });
  lines.push(DASH38);

  lines.push(ticketLine("  SUBTOTAL", formatCOP(subtotal)));
  lines.push(ticketLine(`  ${ivaLabel}`, formatCOP(iva)));
  lines.push(WAVE38);
  lines.push(ticketLine("  TOTAL NETO", formatCOP(total)));
  lines.push(WAVE38);

  if (d.paymentMethod) {
    lines.push(`  Medio de pago: ${d.paymentMethod}`);
  }

  if (d.mode === "electronica" && (d.clientName || d.clientEmail)) {
    lines.push(DASH38);
    lines.push("  DATOS DEL CLIENTE:");
    if (d.clientName)  lines.push(`  Nombre: ${d.clientName}`);
    if (d.clientId)    lines.push(`  ${(d.clientIdType ?? "ID").toUpperCase()}: ${d.clientId}`);
    if (d.clientEmail) lines.push(`  Email: ${d.clientEmail}`);
    lines.push(DASH38);
  }

  if (d.mode === "electronica" && cufe) {
    lines.push("  CUFE (DIAN):");
    lines.push(`  ${cufe.slice(0, 36)}`);
    lines.push("  [ ■ ■ ■ ■  QR DIAN  ■ ■ ■ ■ ]");
  }

  lines.push(DASH38);
  lines.push("  * Conserve este documento *  ");
  lines.push("   www.surtesoft.com/factura   ");
  lines.push(WAVE38);
  return lines;
}

// ── Email sender ──────────────────────────────────────────────────────────
async function sendInvoiceEmail(d: TicketData): Promise<void> {
  const ivaRate = d.ivaRate ?? 0.19;
  const ivaLabel = ivaRate === 0.08 ? "Impoconsumo 8%" : "IVA 19%";
  const subtotal = d.items.reduce((s, i) => s + i.price * i.qty, 0);
  const iva = subtotal * ivaRate;
  const total = subtotal + iva;
  const now = new Date();

  const itemsList = d.items
    .map((i) => `${i.qty}× ${i.desc} — ${formatCOP(i.price * i.qty)}`)
    .join("\n");

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email:        d.clientEmail!,
      to_name:         d.clientName || d.clientEmail!,
      invoice_id:      d.invoiceId,
      restaurant_name: "Zupply IA - Sabores de Bucaramanga",
      invoice_date:    now.toLocaleDateString("es-CO"),
      invoice_time:    now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      items_list:      itemsList,
      subtotal:        formatCOP(subtotal),
      iva_label:       ivaLabel,
      iva_amount:      formatCOP(iva),
      total:           formatCOP(total),
      client_id:       d.clientId ?? "",
      client_id_type:  (d.clientIdType ?? "ID").toUpperCase(),
      cufe:            `${d.invoiceId}-${Date.now().toString(36).toUpperCase()}-DIAN`,
    },
    EMAILJS_PUBLIC_KEY
  );
}

// ── Modal component ───────────────────────────────────────────────────────
type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: TicketData;
};

export function FacturaTicketModal({ isOpen, onClose, data }: Props) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendError, setSendError] = useState("");
  const lines = buildTicketLines(data);

  useEffect(() => {
    if (!isOpen) { setSendStatus("idle"); setSendError(""); }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const content = ticketRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=400,height=700");
    if (!win) return;
    win.document.write(`
      <html><head><title>Factura ${data.invoiceId}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 11px;
               background:#fff; color:#000; margin:0; padding:12px; width:320px; }
        pre  { white-space: pre-wrap; word-break: break-all; margin:0; }
      </style></head>
      <body><pre>${lines.join("\n")}</pre>
      <script>window.print();window.onafterprint=()=>window.close();<\/script>
      </body></html>`);
    win.document.close();
  };

  const handleSendEmail = async () => {
    if (!data.clientEmail) return;
    if (EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID") {
      setSendStatus("error");
      setSendError(
        "Configura tus credenciales de EmailJS en FacturaTicketModal.tsx o como variables VITE_EMAILJS_* en Replit Secrets."
      );
      return;
    }
    setSendStatus("sending");
    setSendError("");
    try {
      await sendInvoiceEmail(data);
      setSendStatus("success");
    } catch (err: unknown) {
      setSendStatus("error");
      setSendError(
        err instanceof Error ? err.message : "Error al enviar. Verifica tus credenciales de EmailJS."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="relative flex flex-col max-h-[90vh] w-full max-w-sm">
        {/* Close button */}
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1 text-sm">
          <X className="w-4 h-4" /> Cerrar
        </button>

        {/* Thermal ticket */}
        <div
          ref={ticketRef}
          className="flex-1 overflow-y-auto bg-white rounded-lg shadow-2xl"
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "11px",
            lineHeight: "1.55",
            padding: "16px 12px",
            color: "#111",
            boxShadow: "0 0 0 1px #e5e7eb, 0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          {/* Ticket notch effect top */}
          <div className="flex gap-1 justify-center mb-2">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />
            ))}
          </div>

          <pre className="whitespace-pre-wrap break-all text-[10.5px] leading-snug select-all">
            {lines.join("\n")}
          </pre>

          {/* Ticket notch effect bottom */}
          <div className="flex gap-1 justify-center mt-2">
            {[...Array(18)].map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-gray-200" />
            ))}
          </div>
        </div>

        {/* Action bar */}
        <div className="mt-3 space-y-2">
          <Button onClick={handlePrint} variant="outline"
            className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2">
            <Printer className="w-4 h-4" /> Imprimir Ticket
          </Button>

          {data.mode === "electronica" && data.clientEmail && (
            <>
              {sendStatus === "idle" && (
                <Button onClick={handleSendEmail}
                  className="w-full bg-green-600 hover:bg-green-500 gap-2 font-bold">
                  <Send className="w-4 h-4" />
                  Enviar al correo: {data.clientEmail}
                </Button>
              )}
              {sendStatus === "sending" && (
                <Button disabled className="w-full bg-green-700 gap-2 font-bold">
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando factura...
                </Button>
              )}
              {sendStatus === "success" && (
                <div className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600/20 border border-green-500 text-green-300 py-3 px-4 text-sm font-semibold">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  ✓ Factura enviada a {data.clientEmail}
                </div>
              )}
              {sendStatus === "error" && (
                <div className="space-y-2">
                  <div className="w-full flex items-start gap-2 rounded-lg bg-red-900/30 border border-red-500 text-red-300 py-2 px-3 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span>{sendError}</span>
                  </div>
                  <Button onClick={handleSendEmail} variant="outline"
                    className="w-full border-red-500 text-red-300 hover:bg-red-950 gap-2 text-sm">
                    <Send className="w-4 h-4" /> Reintentar envío
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
