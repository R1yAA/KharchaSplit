"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function useDeleteAccount() {
  const { workspace, logout } = useWorkspace();
  const router = useRouter();
  return useMutation({
    mutationFn: async () => {
      if (!workspace) throw new Error("Not logged in");
      // FK-ordered deletion: children before parents.
      await supabase.from("recurring_rules").delete().eq("workspace", workspace);
      await supabase.from("investment_valuations").delete().eq("workspace", workspace);
      await supabase.from("investments").delete().eq("workspace", workspace);
      await supabase.from("settlements").delete().eq("workspace", workspace);
      await supabase.from("expenses").delete().eq("workspace", workspace);
      await supabase.from("groups").delete().eq("workspace", workspace);
      await supabase.from("settings").delete().eq("workspace", workspace);
      // localStorage cleanup
      localStorage.removeItem("kharcha.customCategories");
      localStorage.removeItem("kharcha.customInvestmentCategories");
    },
    onSuccess: () => {
      logout();
      router.replace("/login");
    },
  });
}
