import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn, ShoppingCart, Brain, Truck } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    role: "Restaurante",
    username: "restaurante",
    password: "demo123",
    icon: "👨🏽‍🍳",
    color: "bg-orange-50 border-orange-200 hover:border-orange-400",
    badge: "bg-orange-500",
    desc: "Dashboard, pedidos, inventario, costeo",
  },
  {
    role: "Proveedor",
    username: "proveedor",
    password: "demo123",
    icon: "🚚",
    color: "bg-blue-50 border-blue-200 hover:border-blue-400",
    badge: "bg-blue-500",
    desc: "Pedidos entrantes, flota, despacho",
  },
];

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      const ok = login(username, password);
      if (!ok) setError("Credenciales incorrectas. Usa las cuentas demo de abajo.");
      setLoading(false);
    }, 600);
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
    setTimeout(() => {
      setLoading(true);
      setTimeout(() => {
        login(u, p);
        setLoading(false);
      }, 500);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-orange-500 to-orange-600 flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-xl">Z</div>
            <span className="text-2xl font-black tracking-tight">Zupply IA</span>
          </div>
          <h1 className="text-4xl font-black leading-tight mb-4">
            La plataforma B2B<br />para restaurantes<br />y proveedores
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Centraliza tus compras, controla tu inventario con IA predictiva y conecta tu restaurante con los mejores proveedores de Bucaramanga.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: ShoppingCart, label: "Pedidos", val: "Multi-proveedor" },
            { icon: Brain, label: "IA Predictiva", val: "Stock inteligente" },
            { icon: Truck, label: "Rastreo", val: "Tiempo real" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="bg-white/15 rounded-xl p-4">
              <Icon className="w-6 h-6 mb-2 text-white/90" />
              <p className="text-xs text-white/70 font-medium">{label}</p>
              <p className="text-sm font-bold">{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 justify-center">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white font-black text-lg">Z</div>
            <span className="text-2xl font-black text-primary">Zupply IA</span>
          </div>

          <div>
            <h2 className="text-3xl font-black text-foreground">Bienvenido</h2>
            <p className="text-muted-foreground mt-1">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Usuario</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !username || !password}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" /> Iniciar Sesión
                </span>
              )}
            </Button>
          </form>

          {/* Demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cuentas demo</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => quickLogin(acc.username, acc.password)}
                  className={`rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${acc.color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{acc.icon}</span>
                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded-full ${acc.badge}`}>
                      {acc.role}
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-foreground">{acc.username}</p>
                  <p className="text-xs text-muted-foreground">{acc.password}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
