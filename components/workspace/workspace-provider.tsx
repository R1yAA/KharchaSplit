"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface WorkspaceCtx {
  workspace: string | null; // current username; serves as workspace key
  setWorkspace: (name: string) => void;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<WorkspaceCtx | null>(null);
const STORAGE_KEY = "kharcha.workspace";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWs] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) setWs(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!workspace && pathname !== "/login") router.replace("/login");
    if (workspace && pathname === "/login") router.replace("/");
  }, [ready, workspace, pathname, router]);

  const setWorkspace = (name: string) => {
    const norm = name.trim();
    if (!norm) return;
    localStorage.setItem(STORAGE_KEY, norm);
    setWs(norm);
  };
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setWs(null);
  };

  return <Ctx.Provider value={{ workspace, setWorkspace, logout, ready }}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
