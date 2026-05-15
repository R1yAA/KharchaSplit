"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { InvestmentRow } from "@/lib/investments";

export function useInvestments(includeInactive = false) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["investments", workspace, includeInactive],
    enabled: !!workspace,
    queryFn: async (): Promise<InvestmentRow[]> => {
      let q = supabase.from("investments").select("*").eq("workspace", workspace!).order("created_at", { ascending: false });
      if (!includeInactive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as InvestmentRow[];
    },
  });
}

export function useInvestment(id: string | undefined) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["investment", workspace, id],
    enabled: !!workspace && !!id,
    queryFn: async (): Promise<InvestmentRow | null> => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .eq("workspace", workspace!)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as InvestmentRow | null;
    },
  });
}

export function useUpsertInvestment() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (input: Partial<InvestmentRow> & { name: string; principal: number; category: string; start_date: string }) => {
      if (!workspace) throw new Error("Not logged in");
      const payload = { ...input, workspace };
      if (input.id) {
        const { data, error } = await supabase.from("investments").update(payload).eq("id", input.id).select().single();
        if (error) throw error;
        return data as InvestmentRow;
      }
      const { data, error } = await supabase.from("investments").insert(payload).select().single();
      if (error) throw error;
      return data as InvestmentRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments", workspace] });
      qc.invalidateQueries({ queryKey: ["valuations", workspace] });
    },
  });
}

export function useDeleteInvestment() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investments", workspace] }),
  });
}
