import { createContext, useContext, useState, type ReactNode } from "react";

export type SubRole =
  | "admin"
  | "gerente"
  | "empleado"
  | "proveedor_admin"
  | "domiciliario";

export type Role = "restaurante" | "proveedor";

export type AuthUser = {
  username: string;
  name: string;
  role: Role;
  subRole: SubRole;
  entity: string;
  avatar: string;
  permissions: string[];
};

// ── Permission sets per sub-role ──────────────────────────────────────────
const PERMS: Record<SubRole, string[]> = {
  admin: [
    "dashboard", "pedidos", "inventario", "inventario:write",
    "contabilidad", "proveedores", "costeo", "costeo:write",
    "facturacion", "config",
  ],
  gerente: [
    "dashboard", "pedidos", "inventario",
    "contabilidad", "proveedores", "costeo",
    "facturacion",
  ],
  empleado: ["inventario", "costeo"],
  proveedor_admin: [
    "prov:dashboard", "prov:logistica", "prov:inventario",
    "prov:inventario:write", "prov:precios",
  ],
  domiciliario: ["prov:logistica", "prov:gps"],
};

// ── Simulated user database ───────────────────────────────────────────────
type StoredUser = AuthUser & { password: string };

const SEED_USERS: StoredUser[] = [
  {
    username: "admin",
    password: "demo123",
    name: "Carlos Rueda",
    role: "restaurante",
    subRole: "admin",
    entity: "Rancho Grande BGA",
    avatar: "👑",
    permissions: PERMS.admin,
  },
  {
    username: "gerente",
    password: "demo123",
    name: "Laura Vargas",
    role: "restaurante",
    subRole: "gerente",
    entity: "Rancho Grande BGA",
    avatar: "👩🏽‍💼",
    permissions: PERMS.gerente,
  },
  {
    username: "empleado",
    password: "demo123",
    name: "Miguel Torres",
    role: "restaurante",
    subRole: "empleado",
    entity: "Rancho Grande BGA",
    avatar: "👨🏽‍🍳",
    permissions: PERMS.empleado,
  },
  {
    username: "proveedor",
    password: "demo123",
    name: "Pedro Mora",
    role: "proveedor",
    subRole: "proveedor_admin",
    entity: "Carnes El Paisa S.A.S.",
    avatar: "🏭",
    permissions: PERMS.proveedor_admin,
  },
  {
    username: "domiciliario",
    password: "demo123",
    name: "Jhon Díaz",
    role: "proveedor",
    subRole: "domiciliario",
    entity: "Carnes El Paisa S.A.S.",
    avatar: "🏍️",
    permissions: PERMS.domiciliario,
  },
];

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  signup: (data: {
    name: string;
    entity: string;
    username: string;
    password: string;
    role: Role;
    subRole: SubRole;
  }) => { ok: boolean; error?: string };
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  signup: () => ({ ok: false }),
  can: () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<StoredUser[]>(SEED_USERS);
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (username: string, password: string): boolean => {
    const found = users.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      const { password: _p, ...authUser } = found;
      setUser(authUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const signup = (data: {
    name: string;
    entity: string;
    username: string;
    password: string;
    role: Role;
    subRole: SubRole;
  }): { ok: boolean; error?: string } => {
    if (users.find((u) => u.username === data.username)) {
      return { ok: false, error: "Ese nombre de usuario ya está en uso." };
    }
    const newUser: StoredUser = {
      ...data,
      avatar: data.role === "proveedor" ? "🏭" : "👨🏽‍🍳",
      permissions: PERMS[data.subRole],
    };
    setUsers((prev) => [...prev, newUser]);
    const { password: _p, ...authUser } = newUser;
    setUser(authUser);
    return { ok: true };
  };

  const can = (permission: string): boolean =>
    user?.permissions.includes(permission) ?? false;

  return (
    <AuthContext.Provider value={{ user, login, logout, signup, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// ── Static helper (no hook needed) ───────────────────────────────────────
export const ROLE_LABELS: Record<SubRole, string> = {
  admin: "Administrador",
  gerente: "Gerente de Operaciones",
  empleado: "Empleado (Cocina/Barra)",
  proveedor_admin: "Admin de Catálogo",
  domiciliario: "Domiciliario",
};

export const ROLE_COLORS: Record<SubRole, string> = {
  admin: "bg-purple-600",
  gerente: "bg-blue-600",
  empleado: "bg-green-600",
  proveedor_admin: "bg-orange-600",
  domiciliario: "bg-teal-600",
};
