"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { ExpenseRow } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export type NewExpense = Omit<Partial<ExpenseRow>, "id" | "created_at" | "updated_at" | "workspace"> & {
  title: string;
  amount: number;
};

export function useGroupExpenses(groupId: string | undefined) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["expenses", workspace, "group", groupId],
    enabled: !!workspace && !!groupId,
    queryFn: async (): Promise<ExpenseRow[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("workspace", workspace!)
        .eq("group_id", groupId!)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExpenseRow[];
    },
  });
}

export function usePersonalExpenses() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["expenses", workspace, "personal"],
    enabled: !!workspace,
    queryFn: async (): Promise<ExpenseRow[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("workspace", workspace!)
        .eq("is_personal", true)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExpenseRow[];
    },
  });
}

export function useAllExpenses() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["expenses", workspace, "all"],
    enabled: !!workspace,
    queryFn: async (): Promise<ExpenseRow[]> => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("workspace", workspace!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as ExpenseRow[];
    },
  });
}

export function useUpsertExpense() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (e: NewExpense & { id?: string }) => {
      if (!workspace) throw new Error("Not logged in");
      const payload = { ...e, workspace };
      if (e.id) {
        const { data, error } = await supabase.from("expenses").update(payload).eq("id", e.id).select().single();
        if (error) throw error;
        return data as ExpenseRow;
      }
      const { data, error } = await supabase.from("expenses").insert(payload).select().single();
      if (error) throw error;
      return data as ExpenseRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", workspace] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses", workspace] }),
  });
}
