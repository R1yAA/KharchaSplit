"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { SettingsRow } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useSettings() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["settings", workspace],
    enabled: !!workspace,
    queryFn: async (): Promise<SettingsRow | null> => {
      const { data, error } = await supabase.from("settings").select("*").eq("workspace", workspace!).maybeSingle();
      if (error) throw error;
      if (data) return data as SettingsRow;
      // Auto-create defaults on first read.
      const { data: inserted, error: e2 } = await supabase
        .from("settings")
        .insert({ workspace: workspace!, user_name: workspace! })
        .select()
        .single();
      if (e2) throw e2;
      return inserted as SettingsRow;
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (patch: Partial<SettingsRow>) => {
      const { data, error } = await supabase.from("settings").update(patch).eq("workspace", workspace!).select().single();
      if (error) throw error;
      return data as SettingsRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", workspace] }),
  });
}
