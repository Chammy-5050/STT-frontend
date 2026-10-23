"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, clearTokens, saveTokens, tokens, type User } from "@/lib/api";

type Auth = {
  user: User | null; loading: boolean;
  signIn: (email: string, password: string, remember?: boolean) => Promise<User>;
  signOut: () => void; refreshUser: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const reset = () => setUser(null);
    window.addEventListener("stt:logout", reset);
    if (tokens()) api<User>("/users/me/").then(value => { if (active) setUser(value); }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    else queueMicrotask(() => { if (active) setLoading(false); });
    return () => { active = false; window.removeEventListener("stt:logout", reset); };
  }, []);

  async function signIn(email: string, password: string, remember = false) {
    const result = await api<{ access: string; refresh: string }>("/auth/login/", {
      method: "POST", body: JSON.stringify({ email, password }),
    }, false);
    saveTokens(result, remember);
    try { const account = await api<User>("/users/me/"); setUser(account); return account; }
    catch (error) { clearTokens(); throw error; }
  }
  function signOut() { clearTokens(); setUser(null); }
  async function refreshUser() { setUser(await api<User>("/users/me/")); }

  return <Context.Provider value={{ user, loading, signIn, signOut, refreshUser }}>{children}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider is required.");
  return value;
}
