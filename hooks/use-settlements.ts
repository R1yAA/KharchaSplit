"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { SettlementRow } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useSettlements(groupId: string | undefined) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["settlements", workspace, groupId],
    enabled: !!workspace && !!groupId,
    queryFn: async (): Promise<SettlementRow[]> => {
      const { data, error } = await supabase
        .from("settlements")
        .select("*")
        .eq("workspace", workspace!)
        .eq("group_id", groupId!);
      if (error) throw error;
      return data as SettlementRow[];
    },
  });
}

export function useMarkSettlementPaid() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { groupId: string; from: string; to: string; amount: number; paid: boolean }) => {
      if (!workspace) throw new Error("Not logged in");
      // Upsert a settlement marker: composite key (workspace, group, from, to).
      // Simpler: delete + insert to flip state.
      await supabase
        .from("settlements")
        .delete()
        .eq("workspace", workspace)
        .eq("group_id", input.groupId)
        .eq("from_member", input.from)
        .eq("to_member", input.to);
      if (input.paid) {
        const { error } = await supabase.from("settlements").insert({
          workspace,
          group_id: input.groupId,
          from_member: input.from,
          to_member: input.to,
          amount: input.amount,
          is_paid: true,
          paid_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["settlements", workspace, vars.groupId] }),
  });
}
