"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UsuarioSessao {
  id:            string;
  paciente_id:   string;
  nome_acesso:   string;
  email:         string;
  nome_completo: string;
  tipo_usuario:  string; // "funcionario" | "admin" | "financeiro"
}

interface AuthContextType {
  usuario:    UsuarioSessao | null;
  isLoading:  boolean;
  login:      (u: UsuarioSessao) => void;
  logout:     () => void;
  isAdmin:    boolean;
}

const AuthContext = createContext<AuthContextType>({
  usuario:   null,
  isLoading: true,
  login:     () => {},
  logout:    () => {},
  isAdmin:   false,
});

const STORAGE_KEY = "fisiosys_sessao";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario]   = useState<UsuarioSessao | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão do sessionStorage ao montar
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UsuarioSessao;
        setUsuario(parsed);
      }
    } catch {
      // sessão inválida — ignora
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (u: UsuarioSessao) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUsuario(u);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUsuario(null);
  };

  const isAdmin = usuario?.tipo_usuario === "admin";

  return (
    <AuthContext.Provider value={{ usuario, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
