import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Usuario } from "../lib/supabase";

interface AuthContextType {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem("usuario");
    return saved ? JSON.parse(saved) : null;
  });

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem("usuario");
  };

  const setUsuarioAndSave = (user: Usuario | null) => {
    setUsuario(user);
    if (user) {
      localStorage.setItem("usuario", JSON.stringify(user));
    } else {
      localStorage.removeItem("usuario");
    }
  };

  return (
    <AuthContext.Provider
      value={{ usuario, setUsuario: setUsuarioAndSave, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
