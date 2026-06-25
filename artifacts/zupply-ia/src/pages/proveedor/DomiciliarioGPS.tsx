import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "@/context/AuthContext";
import {
  Smartphone, Wifi, WifiOff, Navigation, MapPin, Package,
  CheckCircle, Clock, AlertTriangle, Shield, Fingerprint,
  ChevronRight, Truck, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// ── Types ─────────────────────────────────────────────────────────────────
type DeliveryStatus = "asignado" | "en_camino" | "llegando" | "entregado";

type Delivery = {
  id: string;
  facturaCode: string;
  restaurante: string;
  address: string;
  destPos: [number, number];
  items: { name: string; qty: number; unit: string }[];
  total: number;
  status: DeliveryStatus;
  hora: string;
};

// ── Bucaramanga fallback if GPS denied ─────────────────────────────────────
const BGA_CENTER: [number, number] = [7.1254, -73.1198];

// ── Assigned deliveries for Jhon Díaz (domiciliario demo) ─────────────────
const INITIAL_DELIVERIES: Delivery[] = [
  {
    id: "ZIA-103",
    facturaCode: "FAC-8942",
    restaurante: "La Castellana Grill",
    address: "Av. Quebradaseca 31-40, Bucaramanga",
    destPos: [7.1412, -73.1180],
    items: [{ name: "Pechuga de pollo", qty: 12, unit: "kg" }],
    total: 132000,
    status: "en_camino",
    hora: "09:55",
  },
  {
    id: "ZIA-107",
    facturaCode: "FAC-3317",
    restaurante: "Fogón Santandereano",
    address: "Calle 35 #22-10, San Pío",
    destPos: [7.1305, -73.1254],
    items: [
      { name: "Carne molida", qty: 8, unit: "kg" },
      { name: "Chorizo santandereano", qty: 4, unit: "kg" },
    ],
    total: 298000,
    status: "asignado",
    hora: "10:30",
  },
];

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG: Record<DeliveryStatus, { label: string; color: string; icon: React.ElementType }> = {
  asignado:   { label: "Asignado",   color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  en_camino:  { label: "En Camino",  color: "bg-blue-100 text-blue-800 border-blue-300",       icon: Truck },
  llegando:   { label: "Llegando",   color: "bg-orange-100 text-orange-800 border-orange-300", icon: Navigation },
  entregado:  { label: "Entregado",  color: "bg-green-100 text-green-800 border-green-300",    icon: CheckCircle },
};

const STATUS_ORDER: DeliveryStatus[] = ["asignado", "en_camino", "llegando", "entregado"];

function formatCOP(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

function driverIcon(moving: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${moving ? "#2563eb" : "#6b7280"};width:44px;height:44px;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:20px;${moving ? "animation:pulse 1.5s ease-in-out infinite" : ""}">🏍️</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -46],
  });
}

function destIcon(code: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:#ea580c;padding:4px 8px;border-radius:8px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);color:white;font-size:11px;font-weight:700;white-space:nowrap">${code}</div>`,
    iconSize: [80, 28],
    iconAnchor: [40, 28],
    popupAnchor: [0, -30],
  });
}

// ── MapController – re-centers map on position change ─────────────────────
function MapController({ pos }: { pos: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(pos, map.getZoom()); }, [pos, map]);
  return null;
}

// ── IMEI Pairing Screen ───────────────────────────────────────────────────
function PairingScreen({ onPaired }: { onPaired: (imei: string) => void }) {
  const [imei, setImei]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handlePair = () => {
    if (imei.length < 8) { setError("El IMEI/ID debe tener al menos 8 caracteres."); return; }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      onPaired(imei);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-white text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-blue-200" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">Zupply IA · Logística GPS</p>
            <h1 className="text-2xl font-black">Vincular Dispositivo</h1>
            <p className="text-blue-200 text-sm mt-1">Enlace seguro de red para rastreo en vivo</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 border border-white/20 space-y-4">
          <div className="flex items-center gap-2 text-blue-200 text-sm">
            <Shield className="w-4 h-4" />
            <span>Autenticación por hardware — sesión encriptada</span>
          </div>
          <div className="flex items-center gap-2 text-blue-200 text-sm">
            <Fingerprint className="w-4 h-4" />
            <span>IMEI o ID único del dispositivo asignado</span>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            value={imei}
            onChange={(e) => { setImei(e.target.value.replace(/\s/g, "")); setError(""); }}
            placeholder="Ej: 353456781234567"
            className="h-12 text-center text-sm font-mono bg-white/10 border-white/30 text-white placeholder:text-white/40 focus-visible:ring-blue-400"
            maxLength={20}
          />
          {error && <p className="text-red-300 text-xs">{error}</p>}
          <Button
            onClick={handlePair}
            disabled={loading || imei.length < 8}
            className="w-full h-12 bg-blue-500 hover:bg-blue-400 font-bold text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Vinculando...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Wifi className="w-4 h-4" /> Vincular y Activar GPS</span>
            )}
          </Button>
          <p className="text-xs text-blue-300">Demo: ingresa cualquier ID de 8+ caracteres</p>
        </div>
      </div>
    </div>
  );
}

// ── Main GPS Console ──────────────────────────────────────────────────────
export default function DomiciliarioGPS() {
  const { user } = useAuth();
  const [pairedImei, setPairedImei]         = useState<string | null>(null);
  const [gpsPos, setGpsPos]                 = useState<[number, number]>(BGA_CENTER);
  const [gpsAccuracy, setGpsAccuracy]       = useState<number | null>(null);
  const [gpsActive, setGpsActive]           = useState(false);
  const [gpsError, setGpsError]             = useState<string>("");
  const [deliveries, setDeliveries]         = useState<Delivery[]>(INITIAL_DELIVERIES);
  const [selectedDelivery, setSelected]     = useState<Delivery>(INITIAL_DELIVERIES[0]);
  const [trail, setTrail]                   = useState<[number, number][]>([]);
  const watchId = useRef<number | null>(null);

  // ── GPS ──────────────────────────────────────────────────────────────────
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Tu dispositivo no soporta GPS. Usando posición simulada.");
      setGpsActive(true);
      startSimulation();
      return;
    }
    setGpsError("");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coord: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setGpsPos(coord);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setTrail((prev) => [...prev.slice(-80), coord]);
        setGpsActive(true);
      },
      (err) => {
        setGpsError(
          err.code === 1
            ? "Permiso de ubicación denegado. Activando simulación en Bucaramanga."
            : "Error de GPS. Activando simulación."
        );
        setGpsActive(true);
        startSimulation();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 }
    );
  }, []);

  const stopGPS = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setGpsActive(false);
    setTrail([]);
  }, []);

  // ── Simulation (when GPS denied) ─────────────────────────────────────────
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simStep = useRef(0);

  const startSimulation = () => {
    simStep.current = 0;
    const dest = selectedDelivery.destPos;
    const steps = 80;
    const latStep = (dest[0] - BGA_CENTER[0]) / steps;
    const lngStep = (dest[1] - BGA_CENTER[1]) / steps;
    simRef.current = setInterval(() => {
      simStep.current++;
      const jitter = () => (Math.random() - 0.5) * 0.0006;
      const coord: [number, number] = [
        BGA_CENTER[0] + latStep * simStep.current + jitter(),
        BGA_CENTER[1] + lngStep * simStep.current + jitter(),
      ];
      setGpsPos(coord);
      setGpsAccuracy(Math.floor(Math.random() * 12) + 4);
      setTrail((prev) => [...prev.slice(-80), coord]);
      if (simStep.current >= steps && simRef.current) {
        clearInterval(simRef.current);
      }
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      if (simRef.current) clearInterval(simRef.current);
    };
  }, []);

  const advanceStatus = (id: string) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const idx = STATUS_ORDER.indexOf(d.status);
        const next = STATUS_ORDER[Math.min(idx + 1, STATUS_ORDER.length - 1)];
        return { ...d, status: next };
      })
    );
  };

  if (!pairedImei) return <PairingScreen onPaired={setPairedImei} />;

  const active = deliveries.filter((d) => d.status !== "entregado");
  const done   = deliveries.filter((d) => d.status === "entregado");

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">

      {/* ── Left panel (mobile full width, desktop 380px) ─────────────────── */}
      <div className="w-full md:w-96 md:shrink-0 flex flex-col bg-slate-900 border-r border-slate-700 md:h-screen md:overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-xl">🏍️</div>
              <div>
                <p className="font-black text-sm leading-tight">{user?.name ?? "Domiciliario"}</p>
                <p className="text-blue-300 text-xs">{user?.entity}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-xs font-bold ${gpsActive ? "text-green-400" : "text-slate-400"}`}>
                {gpsActive ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {gpsActive ? "GPS ACTIVO" : "GPS INACTIVO"}
              </div>
              {gpsAccuracy && <p className="text-xs text-blue-300">±{gpsAccuracy}m precisión</p>}
              <p className="text-xs text-slate-400 font-mono">{pairedImei.slice(0, 8)}…</p>
            </div>
          </div>

          {gpsError && (
            <div className="bg-yellow-900/50 border border-yellow-600 rounded-lg p-2 mb-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-200">{gpsError}</p>
            </div>
          )}

          <div className="flex gap-2">
            {!gpsActive ? (
              <Button onClick={startGPS} className="flex-1 bg-green-600 hover:bg-green-500 h-9 text-sm font-bold">
                <Navigation className="w-4 h-4 mr-2" /> Iniciar Rastreo GPS
              </Button>
            ) : (
              <Button onClick={stopGPS} variant="outline"
                className="flex-1 h-9 text-sm font-bold border-red-500 text-red-400 hover:bg-red-950">
                <WifiOff className="w-4 h-4 mr-2" /> Detener GPS
              </Button>
            )}
            <Button onClick={() => setPairedImei(null)} variant="ghost"
              className="h-9 text-slate-400 hover:text-white" title="Cambiar dispositivo">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active deliveries */}
        <div className="p-3 flex-1 space-y-2 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            📦 Entregas Activas ({active.length})
          </p>

          {active.map((d) => {
            const cfg = STATUS_CFG[d.status];
            const StatusIcon = cfg.icon;
            const isSel = selectedDelivery.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelected(d)}
                className={`rounded-xl border-2 p-3 cursor-pointer transition-all space-y-3 ${
                  isSel ? "border-blue-500 bg-blue-950/50" : "border-slate-700 bg-slate-800/60 hover:border-slate-500"
                }`}
              >
                {/* ── INVOICE CODE — prominent display ── */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-3 text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "10px 10px" }} />
                  <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mb-1">
                    📋 Código para el Gerente
                  </p>
                  <p className="text-3xl font-black tracking-widest text-white drop-shadow-lg">{d.facturaCode}</p>
                  <p className="text-xs text-orange-100 mt-1">Muestra este código al recibir la entrega</p>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-white">{d.restaurante}</p>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{d.address}</span>
                    </div>
                  </div>
                  <div className={`shrink-0 border text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </div>
                </div>

                <div className="text-xs space-y-0.5 text-slate-300">
                  {d.items.map((item, i) => (
                    <span key={i} className="inline-block bg-slate-700 rounded px-2 py-0.5 mr-1 mb-1">
                      {item.qty}{item.unit} {item.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold text-sm">{formatCOP(d.total)}</span>
                  {d.status !== "entregado" && (
                    <Button size="sm" onClick={(e) => { e.stopPropagation(); advanceStatus(d.id); }}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-500">
                      {d.status === "llegando" ? "✅ Marcar Entregado" : "Avanzar Estado"}
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {done.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 pt-2">
                ✅ Completadas ({done.length})
              </p>
              {done.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-700 bg-slate-800/30 p-3 opacity-60 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">{d.restaurante}</p>
                    <span className="text-xs font-mono text-green-400">{d.facturaCode}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{d.id}</span>
                    <span className="text-green-400 font-semibold">Entregado ✓</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Right panel: Map ──────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* GPS badge overlay */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <div className={`rounded-xl px-3 py-2 text-xs font-bold shadow-lg ${
            gpsActive ? "bg-green-600 text-white" : "bg-slate-700 text-slate-300"
          }`}>
            {gpsActive ? "🛰️ GPS EN VIVO" : "🛰️ GPS INACTIVO"}
          </div>
          <div className="bg-slate-800/90 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono space-y-0.5">
            <p>Lat: {gpsPos[0].toFixed(6)}</p>
            <p>Lng: {gpsPos[1].toFixed(6)}</p>
            {gpsAccuracy && <p>±{gpsAccuracy}m</p>}
          </div>
        </div>

        {/* Selected delivery info overlay */}
        <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:max-w-xs z-[1000]">
          <div className="bg-slate-900/95 backdrop-blur rounded-2xl border border-slate-700 p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-orange-400" />
              <p className="font-bold text-sm text-white truncate">{selectedDelivery.restaurante}</p>
            </div>
            <div className="bg-orange-600/20 border border-orange-500/50 rounded-lg p-2 text-center mb-2">
              <p className="text-xs text-orange-300 font-semibold">Código de Entrega</p>
              <p className="text-xl font-black text-orange-400 tracking-widest">{selectedDelivery.facturaCode}</p>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {selectedDelivery.address}
            </p>
          </div>
        </div>

        <MapContainer
          center={gpsPos}
          zoom={14}
          className="h-64 md:h-full"
          style={{ height: "100%", minHeight: "320px" }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapController pos={gpsPos} />

          {/* Driver marker */}
          <Marker position={gpsPos} icon={driverIcon(gpsActive)}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold">{user?.name ?? "Domiciliario"}</p>
                <p className="text-xs text-gray-500">IMEI: {pairedImei.slice(0, 8)}…</p>
                {gpsAccuracy && <p className="text-xs">±{gpsAccuracy}m</p>}
              </div>
            </Popup>
          </Marker>

          {/* Destination markers */}
          {active.map((d) => (
            <Marker key={d.id} position={d.destPos} icon={destIcon(d.facturaCode)}>
              <Popup>
                <div className="p-1 min-w-[140px]">
                  <p className="font-bold text-sm">{d.restaurante}</p>
                  <p className="text-xs text-gray-600">{d.address}</p>
                  <p className="font-mono font-black text-orange-600 mt-1">{d.facturaCode}</p>
                  <p className="text-xs">{formatCOP(d.total)}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Route trail */}
          {trail.length > 1 && (
            <Polyline positions={trail} color="#3b82f6" weight={3} opacity={0.8} dashArray="8 6" />
          )}

          {/* Route line to selected destination */}
          {selectedDelivery.status !== "entregado" && (
            <Polyline positions={[gpsPos, selectedDelivery.destPos]} color="#ea580c" weight={4} opacity={0.5} dashArray="12 8" />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
