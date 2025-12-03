"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthSession } from "@/types/user";
import { apiLogin, apiLogout, getStoredSession, fetchCurrentUser } from "./auth-api";

type AuthContextType = {
  user: User | null;
  session: AuthSession | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored session and validate with /api/auth/me
  useEffect(() => {
    async function init() {
      const stored = getStoredSession();
      if (stored) {
        setSession(stored);
        const validated = await fetchCurrentUser();
        if (validated) setSession(validated);
        // If validation fails, keep the stored session to avoid logout on refresh
      }

      setIsLoading(false);
    }

    init();
  }, []);

  const login = async (email: string, password: string) => {
    const newSession = await apiLogin(email, password);
    setSession(newSession);
  };

  const logout = () => {
    apiLogout();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
