import { useState } from "react";
import { useAuth, ROLE_LABELS, ROLE_COLORS } from "@/context/AuthContext";
import Signup from "@/pages/Signup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ShoppingCart, Brain, Truck } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    username: "admin",
    password: "demo123",
    icon: "👑",
    context: "restaurante",
    contextColor: "bg-orange-500",
    border: "border-orange-200 hover:border-orange-400",
    bg: "bg-orange-50",
  },
  {
    username: "gerente",
    password: "demo123",
    icon: "👩🏽‍💼",
    context: "restaurante",
    contextColor: "bg-orange-500",
    border: "border-orange-200 hover:border-orange-400",
    bg: "bg-orange-50",
  },
  {
    username: "empleado",
    password: "demo123",
    icon: "👨🏽‍🍳",
    context: "restaurante",
    contextColor: "bg-orange-500",
    border: "border-orange-200 hover:border-orange-400",
    bg: "bg-orange-50",
  },
  {
    username: "proveedor",
    password: "demo123",
    icon: "🏭",
    context: "proveedor",
    contextColor: "bg-blue-600",
    border: "border-blue-200 hover:border-blue-400",
    bg: "bg-blue-50",
  },
  {
    username: "domiciliario",
    password: "demo123",
    icon: "🏍️",
    context: "proveedor",
    contextColor: "bg-blue-600",
    border: "border-blue-200 hover:border-blue-400",
    bg: "bg-blue-50",
  },
] as const;

export default function Login() {
  const { login } = useAuth();
  const [showSignup, setShowSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (showSignup) return <Signup onBack={() => setShowSignup(false)} />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) setError("Credenciales incorrectas. Usa una de las cuentas demo.");
      setLoading(false);
    }, 500);
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => { login(u, p); setLoading(false); }, 450);
    }, 30);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-xl">Z</div>
            <span className="text-2xl font-black tracking-tight">Zupply IA</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">Sistema ERP · B2B · Multi-Rol</p>
          <h1 className="text-4xl font-black leading-tight mb-4">
            La plataforma B2B<br />para restaurantes<br />y proveedores
          </h1>
          <p className="text-white/80 text-base leading-relaxed">
            Centraliza pedidos, controla inventario con IA predictiva,
            gestiona tu flota y conecta tu negocio con los mejores
            proveedores de Bucaramanga.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShoppingCart, label: "Pedidos", val: "Multi-proveedor" },
            { icon: Brain, label: "IA Predictiva", val: "Stock inteligente" },
            { icon: Truck, label: "Rastreo GPS", val: "Tiempo real" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="bg-white/15 rounded-xl p-3">
              <Icon className="w-5 h-5 mb-2 text-white/90" />
              <p className="text-xs text-white/70">{label}</p>
              <p className="text-sm font-bold">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex-1 flex items-start justify-center overflow-y-auto py-10 px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex lg:hidden items-center gap-2 justify-center mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-black">Z</div>
            <span className="text-xl font-black text-primary">Zupply IA</span>
          </div>

          <div>
            <h2 className="text-2xl font-black">Iniciar Sesión</h2>
            <p className="text-muted-foreground text-sm mt-1">
              ¿Nuevo en Zupply?{" "}
              <button onClick={() => setShowSignup(true)} className="font-semibold text-primary hover:underline">
                Crear cuenta
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Usuario</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario" autoComplete="username" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input type={showPass ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña" autoComplete="current-password" className="h-11 pr-10" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>}
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !username || !password}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> Iniciar Sesión</span>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">5 Cuentas Demo · RBAC</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                // We need ROLE_LABELS but can't call hook here - map manually
                const subRoleMap: Record<string, string> = {
                  admin: "Administrador · Acceso total",
                  gerente: "Gerente · Pedidos + Facturación",
                  empleado: "Empleado · Solo lectura",
                  proveedor: "Proveedor Admin · Catálogo completo",
                  domiciliario: "Domiciliario · Solo logística",
                };
                return (
                  <button
                    key={acc.username}
                    onClick={() => quickLogin(acc.username, acc.password)}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all cursor-pointer ${acc.border} ${acc.bg}`}
                  >
                    <span className="text-xl shrink-0">{acc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{acc.username}</span>
                        <span className={`text-xs text-white px-1.5 py-0.5 rounded-full font-semibold ${acc.contextColor}`}>
                          {acc.context === "restaurante" ? "Restaurante" : "Proveedor"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{subRoleMap[acc.username]}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">demo123</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
