"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/lib/categories";

const KEY = "kharcha.customInvestmentCategories";

function read(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Category[]) : [];
  } catch {
    return [];
  }
}
function write(list: Category[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("kharcha:custom-inv-categories"));
}

export function useCustomInvestmentCategories() {
  const [list, setList] = useState<Category[]>([]);
  useEffect(() => {
    setList(read());
    const on = () => setList(read());
    window.addEventListener("kharcha:custom-inv-categories", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("kharcha:custom-inv-categories", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  const add = useCallback((emoji: string, name: string) => {
    const e = emoji.trim();
    const n = name.trim();
    if (!e || !n) return;
    const id = `custom-inv-${Date.now().toString(36)}`;
    write([...read(), { id, emoji: e, name: n }]);
    return id;
  }, []);
  const remove = useCallback((id: string) => write(read().filter((c) => c.id !== id)), []);
  return { list, add, remove };
}
