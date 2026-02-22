import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { User, LoginCredentials, RegisterData } from "@/types";
import { authService } from "@/services/authService";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (creds: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService
      .getMe()
      .then((u) => {
        if (u) setUser(u);
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  const login = useCallback(async (creds: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await authService.login(creds);
      setUser(u);
      return u;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Login failed";
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const u = await authService.register(data);
      return u;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Registration failed";
      setError(message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
