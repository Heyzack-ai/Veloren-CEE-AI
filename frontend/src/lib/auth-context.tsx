'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthSession } from '@/types/user';
import { mockLogin, mockLogout, getStoredSession } from './mock-auth';

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

  useEffect(() => {
    // Check for stored session on mount
    const storedSession = getStoredSession();
    if (storedSession) {
      setSession(storedSession);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const newSession = await mockLogin(email, password);
    setSession(newSession);
  };

  const logout = () => {
    mockLogout();
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}