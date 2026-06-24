import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "restaurante" | "proveedor";

export type AuthUser = {
  username: string;
  name: string;
  role: Role;
  entity: string;
  avatar: string;
};

const MOCK_USERS: Array<AuthUser & { password: string }> = [
  {
    username: "restaurante",
    password: "demo123",
    name: "Carlos Rueda",
    role: "restaurante",
    entity: "Rancho Grande BGA",
    avatar: "👨🏽‍🍳",
  },
  {
    username: "proveedor",
    password: "demo123",
    name: "Pedro Mora",
    role: "proveedor",
    entity: "Carnes El Paisa S.A.S.",
    avatar: "🚚",
  },
];

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (username: string, password: string): boolean => {
    const found = MOCK_USERS.find(
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

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
