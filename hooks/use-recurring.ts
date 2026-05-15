"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { RecurringRule } from "@/lib/recurrence";

export function useRecurringRules(activeOnly = false) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["recurring", workspace, activeOnly],
    enabled: !!workspace,
    queryFn: async (): Promise<RecurringRule[]> => {
      let q = supabase.from("recurring_rules").select("*").eq("workspace", workspace!).order("created_at", { ascending: false });
      if (activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as RecurringRule[];
    },
  });
}

export function useUpsertRule() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (r: Partial<RecurringRule> & Pick<RecurringRule, "rule_type" | "template" | "frequency">) => {
      if (!workspace) throw new Error("Not logged in");
      const payload = { ...r, workspace };
      if (r.id) {
        const { data, error } = await supabase.from("recurring_rules").update(payload).eq("id", r.id).select().single();
        if (error) throw error;
        return data as RecurringRule;
      }
      const { data, error } = await supabase.from("recurring_rules").insert(payload).select().single();
      if (error) throw error;
      return data as RecurringRule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring", workspace] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring", workspace] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("recurring_rules").update({ is_active: input.is_active }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring", workspace] }),
  });
}

export function useUpdateRuleProgress() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { id: string; last_generated_date: string; generated_count: number; is_active?: boolean }) => {
      const { error } = await supabase
        .from("recurring_rules")
        .update({
          last_generated_date: input.last_generated_date,
          generated_count: input.generated_count,
          ...(input.is_active === false ? { is_active: false } : {}),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring", workspace] }),
  });
}
