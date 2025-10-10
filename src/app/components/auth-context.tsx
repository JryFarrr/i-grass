"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, UserRole } from "../lib/auth-types";

export function getLandingPathForRole(role: UserRole) {
  return role === "admin" ? "/dashboard" : "/exam";
}

type AuthenticatedUser = NonNullable<Session>;
type AuthContextType = {
  user: Session;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  signup: (name: string, email: string, password: string) => Promise<AuthenticatedUser>;
  logout: () => void;
  loginWithGoogle: () => Promise<AuthenticatedUser>;
};

type SessionResponse = { user: Session };
type AuthSuccessResponse = { user: AuthenticatedUser };

type JsonError = { error?: unknown };

async function fetchJson<T>(input: string, init: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    credentials: "include",
    ...init,
  };

  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (config.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  config.headers = headers;

  const response = await fetch(input, config);
  let data: unknown = null;
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(data);
    throw new Error(message);
  }

  return (data ?? {}) as T;
}

function extractErrorMessage(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const { error } = payload as JsonError;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }
  return "Terjadi kesalahan";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadSession() {
      try {
        const data = await fetchJson<SessionResponse>("/api/auth/session", { cache: "no-store" });
        if (!active) return;
        setUser(data.user ?? null);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      async login(email: string, password: string) {
        const data = await fetchJson<AuthSuccessResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(data.user);
        return data.user;
      },
      async signup(name: string, email: string, password: string) {
        const data = await fetchJson<AuthSuccessResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setUser(data.user);
        return data.user;
      },
      logout() {
        fetchJson("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        setUser(null);
      },
      async loginWithGoogle() {
        const data = await fetchJson<AuthSuccessResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: "demo@igras.app", password: "igras123" }),
        });
        setUser(data.user);
        return data.user;
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

