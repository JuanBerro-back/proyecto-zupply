import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, CheckCircle, Clock, Package, Navigation } from "lucide-react";

function makeIcon(bg: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:15px">${label}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });
}
const depotIcon = makeIcon("#16a34a", "🏭");
const restIcon  = makeIcon("#ea580c", "🍽️");
const motoIcon  = makeIcon("#2563eb", "🏍️");
const furIcon   = makeIcon("#7c3aed", "🚚");

// ── Bucaramanga locations ──────────────────────────────────────────────────
const DEPOT: [number, number] = [7.0875, -73.0986]; // Zona industrial Bucaramanga

const RESTAURANTS: Array<{ id: number; name: string; pos: [number, number]; address: string }> = [
  { id: 1, name: "Rancho Grande BGA",      pos: [7.1198, -73.1093], address: "Cra 27 #45-32, Cabecera" },
  { id: 2, name: "Fogón Santandereano",     pos: [7.1305, -73.1254], address: "Calle 35 #22-10, San Pío" },
  { id: 3, name: "La Castellana Grill",     pos: [7.1412, -73.1180], address: "Av. Quebradaseca 31-40" },
  { id: 4, name: "Fritanguería Bonita",     pos: [7.0986, -73.0884], address: "Floridablanca" },
  { id: 5, name: "El Corral BGA",           pos: [7.1347, -73.1228], address: "CC Cabecera L-204" },
];

type VehicleStatus = "disponible" | "en_ruta" | "cargando";
type Vehicle = {
  id: number;
  name: string;
  plate: string;
  type: "moto" | "furgon";
  driver: string;
  status: VehicleStatus;
  assignedTo: number | null;
  pos: [number, number];
};

const INIT_FLEET: Vehicle[] = [
  { id: 1, name: "Moto 1", plate: "BUC-412", type: "moto",   driver: "Carlos Mendoza", status: "disponible", assignedTo: null, pos: [7.0885, -73.0980] },
  { id: 2, name: "Moto 2", plate: "BUC-231", type: "moto",   driver: "Luis Herrera",   status: "en_ruta",    assignedTo: 2,    pos: [7.1100, -73.1080] },
  { id: 3, name: "Furgón", plate: "BUC-789", type: "furgon", driver: "Andrés Torres",  status: "en_ruta",    assignedTo: 1,    pos: [7.1050, -73.1010] },
  { id: 4, name: "Moto 3", plate: "BUC-558", type: "moto",   driver: "Jhon Díaz",      status: "cargando",   assignedTo: null, pos: [7.0880, -73.0978] },
];

const STATUS_STYLE: Record<VehicleStatus, string> = {
  disponible: "bg-green-100 text-green-700 border-green-300",
  en_ruta:    "bg-blue-100 text-blue-700 border-blue-300",
  cargando:   "bg-yellow-100 text-yellow-700 border-yellow-300",
};
const STATUS_LABEL: Record<VehicleStatus, string> = {
  disponible: "Disponible",
  en_ruta:    "En Ruta",
  cargando:   "Cargando",
};

function FitAll({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
  }, [map, points]);
  return null;
}

function LiveVehicle({ vehicle }: { vehicle: Vehicle }) {
  const [pos, setPos] = useState<[number, number]>(vehicle.pos);

  useEffect(() => {
    if (vehicle.status !== "en_ruta" || !vehicle.assignedTo) return;
    const dest = RESTAURANTS.find((r) => r.id === vehicle.assignedTo)?.pos;
    if (!dest) return;
    let t = 0;
    const interval = setInterval(() => {
      t = Math.min(t + 0.004, 0.95);
      setPos([
        vehicle.pos[0] + (dest[0] - vehicle.pos[0]) * t,
        vehicle.pos[1] + (dest[1] - vehicle.pos[1]) * t,
      ]);
    }, 800);
    return () => clearInterval(interval);
  }, [vehicle]);

  const icon = vehicle.type === "moto" ? motoIcon : furIcon;
  const dest = vehicle.assignedTo ? RESTAURANTS.find((r) => r.id === vehicle.assignedTo) : null;

  return (
    <>
      <Marker position={pos} icon={icon}>
        <Popup>
          <strong>{vehicle.name}</strong><br />
          {vehicle.driver} · {vehicle.plate}<br />
          {dest ? `→ ${dest.name}` : STATUS_LABEL[vehicle.status]}
        </Popup>
      </Marker>
      {dest && (
        <Polyline
          positions={[vehicle.pos, pos, dest.pos]}
          pathOptions={{ color: vehicle.type === "moto" ? "#2563eb" : "#7c3aed", weight: 3, dashArray: "6 3", opacity: 0.7 }}
        />
      )}
    </>
  );
}

export default function ProveedorLogistica() {
  const [fleet, setFleet] = useState<Vehicle[]>(INIT_FLEET);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedRest, setSelectedRest] = useState<number | null>(null);

  const dispatch = () => {
    if (!selectedVehicle || !selectedRest) return;
    setFleet((prev) =>
      prev.map((v) =>
        v.id === selectedVehicle ? { ...v, status: "en_ruta", assignedTo: selectedRest } : v
      )
    );
    setSelectedVehicle(null);
    setSelectedRest(null);
  };

  const allPoints: [number, number][] = [DEPOT, ...RESTAURANTS.map((r) => r.pos), ...fleet.map((v) => v.pos)];

  const available = fleet.filter((v) => v.status === "disponible");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Truck className="w-7 h-7 text-primary" /> Logística y Flota
        </h2>
        <p className="text-sm text-muted-foreground">Visualiza rutas, asigna vehículos y monitorea la flota en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Map */}
        <div className="xl:col-span-2 space-y-3">
          <div className="rounded-xl overflow-hidden border shadow-sm" style={{ height: 420 }}>
            <MapContainer center={[7.1100, -73.1050]} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl scrollWheelZoom={false}>
              <FitAll points={allPoints} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />

              {/* Depot */}
              <Marker position={DEPOT} icon={depotIcon}>
                <Popup><strong>🏭 Depósito Central</strong><br />Zona Industrial BGA</Popup>
              </Marker>

              {/* Restaurants */}
              {RESTAURANTS.map((r) => (
                <Marker key={r.id} position={r.pos} icon={restIcon}>
                  <Popup><strong>{r.name}</strong><br />{r.address}</Popup>
                </Marker>
              ))}

              {/* Live vehicles */}
              {fleet.map((v) => <LiveVehicle key={v.id} vehicle={v} />)}
            </MapContainer>
          </div>

          {/* Map legend */}
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap px-1">
            {[["🏭", "Depósito"], ["🍽️", "Restaurante destino"], ["🏍️", "Moto en ruta"], ["🚚", "Furgón en ruta"]].map(([e, l]) => (
              <span key={l} className="flex items-center gap-1">{e} {l}</span>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Dispatch */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" /> Asignar Despacho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vehículo disponible</p>
                {available.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Todos los vehículos están en ruta</p>
                ) : (
                  <div className="space-y-1">
                    {available.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicle(v.id === selectedVehicle ? null : v.id)}
                        className={`w-full rounded-lg border p-2 text-left text-xs transition-all ${
                          selectedVehicle === v.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                        }`}
                      >
                        <span className="font-semibold">{v.type === "moto" ? "🏍️" : "🚚"} {v.name}</span>
                        <span className="text-muted-foreground"> · {v.plate} · {v.driver}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restaurante destino</p>
                <div className="space-y-1">
                  {RESTAURANTS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRest(r.id === selectedRest ? null : r.id)}
                      className={`w-full rounded-lg border p-2 text-left text-xs transition-all ${
                        selectedRest === r.id ? "border-orange-500 bg-orange-50" : "hover:border-orange-300"
                      }`}
                    >
                      <span className="font-semibold">🍽️ {r.name}</span>
                      <br /><span className="text-muted-foreground">{r.address}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!selectedVehicle || !selectedRest}
                onClick={dispatch}
              >
                <Truck className="w-4 h-4 mr-2" /> Despachar Pedido
              </Button>
            </CardContent>
          </Card>

          {/* Fleet status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Estado de la Flota
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fleet.map((v) => {
                const dest = v.assignedTo ? RESTAURANTS.find((r) => r.id === v.assignedTo) : null;
                return (
                  <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <span className="text-xl">{v.type === "moto" ? "🏍️" : "🚚"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">{v.name} · <span className="font-mono">{v.plate}</span></p>
                      <p className="text-xs text-muted-foreground truncate">
                        {dest ? `→ ${dest.name}` : v.driver}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-xs border ${STATUS_STYLE[v.status]}`}>
                      {STATUS_LABEL[v.status]}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
