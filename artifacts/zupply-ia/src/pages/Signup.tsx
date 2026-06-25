import { useState } from "react";
import { useAuth, type Role, type SubRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, UserPlus, ArrowLeft, Building2, Truck } from "lucide-react";

type ContextOption = {
  role: Role;
  label: string;
  description: string;
  icon: string;
  color: string;
  border: string;
  subRoles: { value: SubRole; label: string; desc: string }[];
};

const CONTEXTS: ContextOption[] = [
  {
    role: "restaurante",
    label: "Restaurante",
    description: "Gestiona pedidos, inventario, costeo y contabilidad de tu negocio gastronómico.",
    icon: "🍽️",
    color: "bg-orange-500",
    border: "border-orange-400",
    subRoles: [
      { value: "admin",    label: "Administrador",           desc: "Acceso total al sistema" },
      { value: "gerente",  label: "Gerente de Operaciones",  desc: "Pedidos, facturación y reportes" },
      { value: "empleado", label: "Empleado (Cocina/Barra)", desc: "Solo lectura de inventario y recetas" },
    ],
  },
  {
    role: "proveedor",
    label: "Proveedor",
    description: "Gestiona tu catálogo, pedidos entrantes, flota de vehículos y despachos.",
    icon: "🚚",
    color: "bg-blue-600",
    border: "border-blue-400",
    subRoles: [
      { value: "proveedor_admin", label: "Admin de Catálogo",      desc: "Gestión total del negocio" },
      { value: "domiciliario",    label: "Domiciliario / Envíos",  desc: "Solo logística y rutas asignadas" },
    ],
  },
];

export default function Signup({ onBack }: { onBack: () => void }) {
  const { signup } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCtx, setSelectedCtx] = useState<ContextOption | null>(null);
  const [selectedSubRole, setSelectedSubRole] = useState<SubRole | null>(null);
  const [form, setForm] = useState({ name: "", entity: "", username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const chooseCtx = (ctx: ContextOption) => {
    setSelectedCtx(ctx);
    setSelectedSubRole(null);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCtx || !selectedSubRole) return;
    if (!form.name || !form.entity || !form.username || !form.password) {
      setError("Completa todos los campos.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      const result = signup({
        name: form.name,
        entity: form.entity,
        username: form.username,
        password: form.password,
        role: selectedCtx.role,
        subRole: selectedSubRole,
      });
      if (!result.ok) setError(result.error ?? "Error al registrar.");
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={step === 2 ? () => setStep(1) : onBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Atrás
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black">Z</div>
            <span className="font-black text-xl text-primary">Zupply IA</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-black">Crear cuenta</h1>
              <p className="text-muted-foreground mt-1">¿Cómo quieres unirte a Zupply IA?</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONTEXTS.map((ctx) => (
                <button
                  key={ctx.role}
                  onClick={() => chooseCtx(ctx)}
                  className={`rounded-2xl border-2 p-6 text-left transition-all hover:shadow-lg hover:${ctx.border} hover:-translate-y-0.5 group`}
                >
                  <div className={`w-14 h-14 ${ctx.color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md`}>
                    {ctx.icon}
                  </div>
                  <h2 className="text-xl font-black mb-2 flex items-center gap-2">
                    {ctx.role === "restaurante" ? <Building2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                    Unirme como {ctx.label}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{ctx.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {ctx.subRoles.map((sr) => (
                      <span key={sr.value} className="text-xs bg-muted px-2 py-0.5 rounded-full">{sr.label}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && selectedCtx && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{selectedCtx.icon}</span>
                <h1 className="text-2xl font-black">Registrarse como {selectedCtx.label}</h1>
              </div>
              <p className="text-muted-foreground text-sm">Elige tu rol y completa tus datos</p>
            </div>

            {/* Sub-role selector */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Rol en la organización</Label>
              <div className="grid gap-2">
                {selectedCtx.subRoles.map((sr) => (
                  <button
                    key={sr.value}
                    onClick={() => setSelectedSubRole(sr.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedSubRole === sr.value
                        ? `${selectedCtx.border} bg-orange-50`
                        : "border-border hover:border-muted-foreground/40"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${selectedSubRole === sr.value ? selectedCtx.color : "bg-muted-foreground/30"}`} />
                    <div>
                      <p className="font-semibold text-sm">{sr.label}</p>
                      <p className="text-xs text-muted-foreground">{sr.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tu nombre completo</Label>
                  <Input value={form.name} onChange={(e) => setField("name", e.target.value)}
                    placeholder="Ej: Carlos Rueda" className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>{selectedCtx.role === "restaurante" ? "Nombre del restaurante" : "Nombre de la empresa"}</Label>
                  <Input value={form.entity} onChange={(e) => setField("entity", e.target.value)}
                    placeholder={selectedCtx.role === "restaurante" ? "Ej: Rancho Grande BGA" : "Ej: Carnes El Paisa"} className="h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre de usuario</Label>
                <Input value={form.username} onChange={(e) => setField("username", e.target.value)}
                  placeholder="Sin espacios, ej: carlos.rueda" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label>Contraseña</Label>
                <div className="relative">
                  <Input type={showPass ? "text" : "password"} value={form.password}
                    onChange={(e) => setField("password", e.target.value)}
                    placeholder="Mínimo 6 caracteres" className="h-11 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
              )}

              <Button type="submit" className="w-full h-11 text-base font-semibold"
                disabled={loading || !selectedSubRole || !form.name || !form.entity || !form.username || !form.password}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><UserPlus className="w-5 h-5" /> Crear Cuenta</span>
                )}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <button onClick={onBack} className="font-semibold text-primary hover:underline">
            Iniciar Sesión
          </button>
        </p>
      </div>
    </div>
  );
}
