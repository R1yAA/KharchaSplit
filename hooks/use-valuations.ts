"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { ValuationRow } from "@/lib/investments";

export function useValuations(investmentId?: string) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["valuations", workspace, investmentId ?? "all"],
    enabled: !!workspace,
    queryFn: async (): Promise<ValuationRow[]> => {
      let q = supabase.from("investment_valuations").select("*").eq("workspace", workspace!).order("date", { ascending: false });
      if (investmentId) q = q.eq("investment_id", investmentId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ValuationRow[];
    },
  });
}

export function useUpsertValuation() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (v: { investment_id: string; value: number; date: string }) => {
      if (!workspace) throw new Error("Not logged in");
      // unique(investment_id, date) → upsert
      const { error } = await supabase.from("investment_valuations").upsert(
        { workspace, ...v },
        { onConflict: "investment_id,date" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["valuations", workspace] }),
  });
}

export function useDeleteValuation() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investment_valuations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["valuations", workspace] }),
  });
}
