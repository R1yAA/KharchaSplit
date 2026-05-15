"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/lib/categories";

const KEY = "kharcha.customCategories";

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
  window.dispatchEvent(new Event("kharcha:custom-categories"));
}

export function useCustomCategories() {
  const [list, setList] = useState<Category[]>([]);

  useEffect(() => {
    setList(read());
    const onChange = () => setList(read());
    window.addEventListener("kharcha:custom-categories", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("kharcha:custom-categories", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((emoji: string, name: string) => {
    const trimmed = name.trim();
    const e = emoji.trim();
    if (!trimmed || !e) return;
    const id = `custom-${Date.now().toString(36)}`;
    const next = [...read(), { id, emoji: e, name: trimmed }];
    write(next);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((c) => c.id !== id));
  }, []);

  return { list, add, remove };
}
