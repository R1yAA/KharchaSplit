"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { GroupRow } from "@/lib/supabase/types";
import { useWorkspace } from "@/components/workspace/workspace-provider";

const KEY = (ws: string) => ["groups", ws] as const;

export function useGroups() {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: KEY(workspace ?? ""),
    enabled: !!workspace,
    queryFn: async (): Promise<GroupRow[]> => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("workspace", workspace!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as GroupRow[];
    },
  });
}

export function useGroup(id: string | undefined) {
  const { workspace } = useWorkspace();
  return useQuery({
    queryKey: ["group", workspace, id],
    enabled: !!workspace && !!id,
    queryFn: async (): Promise<GroupRow | null> => {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("workspace", workspace!)
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as GroupRow | null;
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { name: string; icon: string; members: string[] }) => {
      if (!workspace) throw new Error("Not logged in");
      const { data, error } = await supabase
        .from("groups")
        .insert({ workspace, name: input.name, icon: input.icon, members: input.members })
        .select()
        .single();
      if (error) throw error;
      return data as GroupRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspace ?? "") }),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; icon?: string; members?: string[] }) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase.from("groups").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as GroupRow;
    },
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: KEY(workspace ?? "") });
      qc.invalidateQueries({ queryKey: ["group", workspace, g.id] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  const { workspace } = useWorkspace();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("groups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY(workspace ?? "") }),
  });
}
