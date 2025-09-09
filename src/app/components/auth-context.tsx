"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "../../app/lib/auth";
import { clearSession, getSession, login as loginFn, seedDefaultUser, signup as signupFn } from "../../app/lib/auth";

type AuthContextType = {
  user: Session;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed demo user once
    seedDefaultUser();
    setUser(getSession());
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      async login(email: string, password: string) {
        loginFn(email, password);
        setUser(getSession());
      },
      async signup(name: string, email: string, password: string) {
        signupFn(name, email, password);
        setUser(getSession());
      },
      logout() {
        clearSession();
        setUser(null);
      },
      async loginWithGoogle() {
        const { loginWithGoogle } = await import("../../app/lib/auth");
        loginWithGoogle();
        setUser(getSession());
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
